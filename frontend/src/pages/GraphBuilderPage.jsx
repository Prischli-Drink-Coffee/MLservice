import React from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
} from "@xyflow/react";
import { Box, useToast } from "@chakra-ui/react";
import { createGraph, updateGraph, getNodeRegistry, getGraph } from "../API";
import { useParams } from "react-router-dom";
import { connectionLimitPerHandle, highlightMode } from "../config/builderConfig";
import {
  CustomGraphNode,
  GraphToolbar,
  NodesPalette,
  PropertiesPanel,
  GraphContextMenu,
  AlignmentMenu,
} from "../components/graph";
import {
  getLayoutedNodes,
  alignNodesHorizontally,
  alignNodesVertically,
  distributeNodesHorizontally,
  distributeNodesVertically,
} from "../utils/graphLayoutUtils";

const DEFAULT_SOURCE_HANDLE = "out";
const DEFAULT_TARGET_HANDLE = "in";

const roundCoordinate = (value) => {
  const num = Number.isFinite(value) ? value : Number(value ?? 0);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 1000) / 1000;
};

const createNodesIndex = (nodes) => {
  const index = new Map();
  nodes.forEach((node) => {
    if (!node || typeof node !== "object") {
      return;
    }
    const id = String(node.id ?? "");
    if (!id) {
      return;
    }
    const rawType = node._rawType || node.type || "custom";
    index.set(id, { rawType });
  });
  return index;
};

const normalizeNodeForSnapshot = (node) => {
  const id = String(node.id ?? "");
  const position = node.position || { x: 0, y: 0 };
  return {
    id,
    type: node._rawType || node.type || "custom",
    position: {
      x: roundCoordinate(position.x),
      y: roundCoordinate(position.y),
    },
    data: node._rawData || node.data?._rawData || {},
  };
};

const resolveHandlesForSnapshot = (edge, nodesIndex) => {
  const src = nodesIndex.get(String(edge.source ?? ""));
  const dst = nodesIndex.get(String(edge.target ?? ""));
  const srcType = src?.rawType || "";
  const dstType = dst?.rawType || "";
  const sourceHandle =
    edge.sourceHandle || (srcType === "telegram.webhook" ? "envelope" : DEFAULT_SOURCE_HANDLE);
  const targetHandle =
    edge.targetHandle || (dstType === "telegram.response" ? "payload" : DEFAULT_TARGET_HANDLE);
  return { sourceHandle, targetHandle };
};

const normalizeEdgeForSnapshot = (edge, nodesIndex, fallbackIndex) => {
  const { sourceHandle, targetHandle } = resolveHandlesForSnapshot(edge, nodesIndex);
  return {
    id: edge.id ? String(edge.id) : `edge-${fallbackIndex}`,
    source: String(edge.source ?? ""),
    sourceHandle,
    target: String(edge.target ?? ""),
    targetHandle,
  };
};

const serializeGraphSnapshot = (nodes, edges, name, description) => {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeEdges = Array.isArray(edges) ? edges : [];
  const nodesIndex = createNodesIndex(safeNodes);
  const normalizedNodes = safeNodes
    .map(normalizeNodeForSnapshot)
    .sort((a, b) => a.id.localeCompare(b.id));
  const normalizedEdges = safeEdges
    .map((edge, idx) => normalizeEdgeForSnapshot(edge, nodesIndex, idx))
    .sort((a, b) => a.id.localeCompare(b.id));

  return JSON.stringify({
    name: typeof name === "string" ? name : (name ?? ""),
    description: typeof description === "string" ? description : (description ?? ""),
    nodes: normalizedNodes,
    edges: normalizedEdges,
  });
};

function GraphBuilderPage() {
  const toast = useToast();
  const { graphId } = useParams();
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [registry, setRegistry] = React.useState(null);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const initialSnapshotRef = React.useRef(serializeGraphSnapshot([], [], "", ""));
  const [selection, setSelection] = React.useState({ nodes: [], edges: [] });
  const [gridEnabled, setGridEnabled] = React.useState(true);
  const [minimapEnabled, setMinimapEnabled] = React.useState(true);
  const [paletteCollapsed, setPaletteCollapsed] = React.useState(false);
  const [propertiesCollapsed, setPropertiesCollapsed] = React.useState(false);

  // Undo/Redo state with useRef to avoid re-render cycles
  const historyRef = React.useRef([]);
  const historyIndexRef = React.useRef(-1);
  const isApplyingHistoryRef = React.useRef(false);
  const isDraggingRef = React.useRef(false);
  const maxHistorySize = 50;

  // Context menu state
  const [contextMenu, setContextMenu] = React.useState(null);

  // Clipboard state
  const [clipboard, setClipboard] = React.useState(null);

  // Save to history when nodes/edges change (debounced)
  const saveToHistory = React.useCallback(() => {
    if (isApplyingHistoryRef.current || isDraggingRef.current) {
      // Don't save to history if we're applying undo/redo or actively dragging
      return;
    }

    const newState = { nodes, edges };
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(newState);

    // Limit history size
    if (newHistory.length > maxHistorySize) {
      newHistory.shift();
    } else {
      historyIndexRef.current++;
    }

    historyRef.current = newHistory;
  }, [nodes, edges]);

  // Debounced save to history - increased to 1000ms for better performance
  React.useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) return;

    const timer = setTimeout(() => {
      saveToHistory();
    }, 1000); // Increased from 300ms to 1000ms for better performance

    return () => clearTimeout(timer);
  }, [nodes, edges, saveToHistory]);

  React.useEffect(() => {
    (async () => {
      try {
        const reg = await getNodeRegistry();
        setRegistry(reg);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const nodeTypes = React.useMemo(() => ({ default: CustomGraphNode }), []);

  // Handle config changes from CustomGraphNode
  const handleConfigChange = React.useCallback(
    (nodeId, newConfig) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              _rawData: newConfig,
              data: {
                ...n.data,
                _rawData: newConfig,
              },
            };
          }
          return n;
        }),
      );
      setHasChanges(true);
    },
    [setNodes],
  );

  const enrichNodeIO = React.useCallback(
    (type, data = {}) => {
      if (!registry) return { ...data };
      const def = registry.nodes?.[type];
      if (!def) return { ...data };
      return {
        ...data,
        __inputs: def.inputs || {},
        __outputs: def.outputs || {},
        meta: {
          ...(data.meta || {}),
          ...def.meta,
          config_schema: def.config_schema || null,
        },
        onConfigChange: handleConfigChange,
      };
    },
    [registry, handleConfigChange],
  );

  React.useEffect(() => {
    let cancelled = false;

    const loadGraph = async () => {
      if (!graphId) {
        if (!cancelled) {
          initialSnapshotRef.current = serializeGraphSnapshot([], [], "", "");
          setHasChanges(false);
        }
        return;
      }

      try {
        const g = await getGraph(graphId);
        if (cancelled) {
          return;
        }

        const initNodes = (g.nodes || []).map((n) => ({
          id: n.id,
          type: "default",
          position: n.position || { x: 0, y: 0 },
          data: { label: n.type, ...enrichNodeIO(n.type, n.data) },
          _rawType: n.type,
          _rawData: n.data || {},
        }));

        const initEdges = (g.edges || []).map((e, idx) => ({
          id: e.id || `e-${idx}`,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
        }));

        setName(g.name || "");
        setDescription(g.description || "");
        setNodes(initNodes);
        setEdges(initEdges);

        initialSnapshotRef.current = serializeGraphSnapshot(
          initNodes,
          initEdges,
          g.name || "",
          g.description || "",
        );
        setHasChanges(false);
      } catch (e) {
        if (!cancelled) {
          const msg = e.response?.data?.detail || e.message;
          toast({ title: "Не удалось загрузить граф", description: msg, status: "error" });
        }
      }
    };

    loadGraph();

    return () => {
      cancelled = true;
    };
  }, [graphId, setNodes, setEdges, toast, enrichNodeIO]);

  // Drag & Drop from NodesPalette
  const onDragOver = React.useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = React.useCallback(
    (event) => {
      event.preventDefault();
      if (!reactFlowInstance) return;

      const data = event.dataTransfer.getData("application/reactflow");
      if (!data) return;

      try {
        const { type, meta } = JSON.parse(data);
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const id = `${type}-${Date.now()}`;
        const newNode = {
          id,
          type: "default",
          position,
          data: { label: type, ...enrichNodeIO(type, {}) },
          _rawType: type,
          _rawData: {},
        };

        setNodes((nds) => nds.concat(newNode));
        setHasChanges(true);
      } catch (error) {
        console.error("Failed to parse drop data:", error);
      }
    },
    [reactFlowInstance, enrichNodeIO, setNodes],
  );

  // Listen for custom touch drop event from NodesPalette
  React.useEffect(() => {
    const handleTouchDrop = (event) => {
      if (!reactFlowInstance) return;

      const { nodeType, nodeMeta, position } = event.detail;

      try {
        const flowPosition = reactFlowInstance.screenToFlowPosition({
          x: position.x,
          y: position.y,
        });

        const id = `${nodeType}-${Date.now()}`;
        const newNode = {
          id,
          type: "default",
          position: flowPosition,
          data: { label: nodeType, ...enrichNodeIO(nodeType, {}) },
          _rawType: nodeType,
          _rawData: {},
        };

        setNodes((nds) => nds.concat(newNode));
        setHasChanges(true);
      } catch (error) {
        console.error("Failed to handle touch drop:", error);
      }
    };

    const pane = document.querySelector(".react-flow__pane");
    if (pane) {
      pane.addEventListener("node-palette-drop", handleTouchDrop);
      return () => {
        pane.removeEventListener("node-palette-drop", handleTouchDrop);
      };
    }
  }, [reactFlowInstance, enrichNodeIO, setNodes]);

  React.useEffect(() => {
    const currentSnapshot = serializeGraphSnapshot(nodes, edges, name, description);
    const baselineSnapshot = initialSnapshotRef.current;

    if (!baselineSnapshot) {
      initialSnapshotRef.current = currentSnapshot;
      if (hasChanges) {
        setHasChanges(false);
      }
      return;
    }

    if (baselineSnapshot === currentSnapshot) {
      if (hasChanges) {
        setHasChanges(false);
      }
    } else if (!hasChanges) {
      setHasChanges(true);
    }
  }, [nodes, edges, name, description, hasChanges]);

  const resolveHandles = React.useCallback(
    (e) => {
      const src = nodes.find((n) => n.id === e.source);
      const dst = nodes.find((n) => n.id === e.target);
      const srcType = src?._rawType || "";
      const dstType = dst?._rawType || "";
      const defaultSourceHandle =
        srcType === "telegram.webhook" ? "envelope" : e.sourceHandle || "out";
      const defaultTargetHandle =
        dstType === "telegram.response" ? "payload" : e.targetHandle || "in";
      return {
        sourceHandle: defaultSourceHandle,
        targetHandle: defaultTargetHandle,
        srcType,
        dstType,
      };
    },
    [nodes],
  );

  const arePortsCompatible = React.useCallback(
    (srcType, sourceHandle, dstType, targetHandle) => {
      if (!registry) return true;
      const srcNode = registry.nodes[srcType];
      const dstNode = registry.nodes[dstType];
      if (!srcNode || !dstNode) return true;
      const srcKinds = srcNode.outputs[sourceHandle]?.type || "";
      const dstKinds = dstNode.inputs[targetHandle]?.type || "";
      if (!srcKinds || !dstKinds) return true;
      const sk = srcKinds.split(/\s*,\s*/);
      const dk = dstKinds.split(/\s*,\s*/);
      return sk.some((k) => dk.includes(k) || k === "any" || dk.includes("any"));
    },
    [registry],
  );

  const computeAllowedTargets = React.useCallback(
    (srcNodeId, sourceHandle) => {
      const src = nodes.find((n) => n.id === srcNodeId);
      const srcType = src?._rawType || "";
      if (!registry || !srcType) return [];
      const srcNodeDef = registry.nodes[srcType];
      if (!srcNodeDef) return [];
      const outType = srcNodeDef.outputs?.[sourceHandle]?.type || "any";
      const candidates = [];
      nodes.forEach((n) => {
        const dstDef = registry.nodes[n._rawType || ""];
        if (!dstDef) return;
        Object.entries(dstDef.inputs || {}).forEach(([inKey, schema]) => {
          const dstType = (schema.type || "").split(/\s*,\s*/);
          const ok = outType === "any" || dstType.includes(outType) || dstType.includes("any");
          if (ok) {
            candidates.push({ nodeId: n.id, handle: inKey });
          }
        });
      });
      return candidates;
    },
    [nodes, registry],
  );

  const setHighlightForConnecting = React.useCallback(
    (sourceId, sourceHandle) => {
      if (!highlightMode.sourceToTargets) return;
      const allowed = computeAllowedTargets(sourceId, sourceHandle);
      const allowedByNode = allowed.reduce((acc, x) => {
        acc[x.nodeId] = acc[x.nodeId] || [];
        acc[x.nodeId].push(x.handle);
        return acc;
      }, {});
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            __connecting: true,
            __highlightMode: "targets",
            __allowedTargets: allowedByNode[n.id] || [],
          },
        })),
      );
    },
    [computeAllowedTargets, setNodes],
  );

  const clearHighlight = React.useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          __connecting: false,
          __highlightMode: undefined,
          __allowedTargets: [],
          __allowedSources: [],
        },
      })),
    );
  }, [setNodes]);

  // Handle config changes from CustomGraphNode
  const onConnectStart = React.useCallback(
    (_event, params) => {
      if (params.handleType === "source") {
        setHighlightForConnecting(params.nodeId, params.handleId || "out");
      }
    },
    [setHighlightForConnecting],
  );

  const onConnectEnd = React.useCallback(() => {
    clearHighlight();
  }, [clearHighlight]);

  const connectionCountByHandle = React.useMemo(() => {
    const count = {};
    edges.forEach((e) => {
      const keyS = `${e.source}:${e.sourceHandle || "out"}`;
      const keyT = `${e.target}:${e.targetHandle || "in"}`;
      count[keyS] = (count[keyS] || 0) + 1;
      count[keyT] = (count[keyT] || 0) + 1;
    });
    return count;
  }, [edges]);

  const limitPerHandle = connectionLimitPerHandle; // from config

  const exceedsLimit = React.useCallback(
    (nodeId, handleId) => {
      const key = `${nodeId}:${handleId}`;
      return (connectionCountByHandle[key] || 0) >= limitPerHandle;
    },
    [connectionCountByHandle, limitPerHandle],
  );

  const guardedOnConnect = React.useCallback(
    (params) => {
      const { sourceHandle, targetHandle, srcType, dstType } = resolveHandles(params);

      if (exceedsLimit(params.source, sourceHandle)) {
        toast({
          title: "Лимит соединений исчерпан",
          description: `${params.source}.${sourceHandle}`,
          status: "warning",
        });
        return;
      }
      if (exceedsLimit(params.target, targetHandle)) {
        toast({
          title: "Лимит соединений исчерпан",
          description: `${params.target}.${targetHandle}`,
          status: "warning",
        });
        return;
      }

      if (!arePortsCompatible(srcType, sourceHandle, dstType, targetHandle)) {
        toast({
          title: "Несовместимые порты",
          description: `${srcType}.${sourceHandle} → ${dstType}.${targetHandle}`,
          status: "warning",
        });
        return; // блокируем добавление ребра
      }
      setEdges((eds) => addEdge({ ...params, sourceHandle, targetHandle }, eds));
    },
    [resolveHandles, exceedsLimit, arePortsCompatible, toast, setEdges],
  );

  const buildPayload = React.useCallback(
    () => ({
      name: name || "Untitled graph",
      description: description || null,
      is_active: true,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n._rawType || "custom",
        position: n.position,
        data: n._rawData || {},
      })),
      edges: edges.map((e, idx) => {
        const { sourceHandle, targetHandle } = resolveHandles(e);
        return {
          id: e.id || `e-${idx}`,
          source: e.source,
          sourceHandle,
          target: e.target,
          targetHandle,
        };
      }),
    }),
    [name, description, nodes, edges, resolveHandles],
  );

  const saveGraph = React.useCallback(async () => {
    setIsSaving(true);
    try {
      const payload = buildPayload();
      if (graphId) {
        await updateGraph(graphId, payload);
      } else {
        await createGraph(payload);
      }
      initialSnapshotRef.current = serializeGraphSnapshot(nodes, edges, name, description);
      toast({ title: "Граф сохранён", status: "success" });
      setHasChanges(false);
    } catch (e) {
      const msg = e.response?.data?.detail || e.message;
      toast({ title: "Не удалось сохранить", description: msg, status: "error" });
    } finally {
      setIsSaving(false);
    }
  }, [buildPayload, graphId, toast, nodes, edges, name, description]);

  const saveAsNew = async () => {
    setIsSaving(true);
    try {
      const payload = buildPayload();
      await createGraph(payload);
      initialSnapshotRef.current = serializeGraphSnapshot(nodes, edges, name, description);
      toast({ title: "Граф сохранён как новый", status: "success" });
      setHasChanges(false);
    } catch (e) {
      const msg = e.response?.data?.detail || e.message;
      toast({ title: "Не удалось сохранить", description: msg, status: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const payload = buildPayload();
    const dataStr = JSON.stringify(payload, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name || "graph"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Граф экспортирован", status: "success" });
  };

  const handleValidate = () => {
    setIsValidating(true);
    setTimeout(() => {
      const errors = [];

      // Check for disconnected nodes
      const connectedNodes = new Set();
      edges.forEach((e) => {
        connectedNodes.add(e.source);
        connectedNodes.add(e.target);
      });
      const disconnected = nodes.filter((n) => !connectedNodes.has(n.id));
      if (disconnected.length > 0) {
        errors.push(`Найдено ${disconnected.length} отключенных нод`);
      }

      // Check for cycles (simple check)
      // TODO: implement proper cycle detection

      if (errors.length === 0) {
        toast({ title: "Валидация пройдена", status: "success" });
      } else {
        toast({
          title: "Обнаружены проблемы",
          description: errors.join(", "),
          status: "warning",
          duration: 5000,
        });
      }
      setIsValidating(false);
    }, 500);
  };

  const handleAutoLayout = React.useCallback(() => {
    if (nodes.length === 0) {
      toast({ title: "Нет нод для раскладки", status: "info" });
      return;
    }

    try {
      const layoutedNodes = getLayoutedNodes(nodes, edges, {
        direction: "TB",
        nodeWidth: 200,
        nodeHeight: 80,
        rankSep: 80,
        nodeSep: 50,
      });

      setNodes(layoutedNodes);
      setHasChanges(true);

      // Fit view after layout
      setTimeout(() => {
        reactFlowInstance?.fitView({ padding: 0.2, duration: 400 });
      }, 50);

      toast({
        title: "Граф расставлен автоматически",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error("Auto-layout failed:", error);
      toast({
        title: "Ошибка auto-layout",
        description: error.message,
        status: "error",
      });
    }
  }, [nodes, edges, setNodes, reactFlowInstance, toast]);

  // Undo function
  const undo = React.useCallback(() => {
    if (historyIndexRef.current <= 0) return;

    isApplyingHistoryRef.current = true;
    historyIndexRef.current--;
    const prevState = historyRef.current[historyIndexRef.current];

    setNodes(prevState.nodes);
    setEdges(prevState.edges);
    setHasChanges(true);

    setTimeout(() => {
      isApplyingHistoryRef.current = false;
    }, 100);
  }, [setNodes, setEdges]);

  // Redo function
  const redo = React.useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;

    isApplyingHistoryRef.current = true;
    historyIndexRef.current++;
    const nextState = historyRef.current[historyIndexRef.current];

    setNodes(nextState.nodes);
    setEdges(nextState.edges);
    setHasChanges(true);

    setTimeout(() => {
      isApplyingHistoryRef.current = false;
    }, 100);
  }, [setNodes, setEdges]);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl+Z / Cmd+Z
      if (ctrlKey && e.key === "z" && !e.shiftKey) {
        if (historyIndexRef.current > 0) {
          e.preventDefault();
          undo();
          toast({ title: "Отменено", status: "info", duration: 1000 });
        }
        return;
      }

      // Redo: Ctrl+Y / Cmd+Shift+Z
      if ((ctrlKey && e.key === "y") || (ctrlKey && e.shiftKey && e.key === "z")) {
        if (historyIndexRef.current < historyRef.current.length - 1) {
          e.preventDefault();
          redo();
          toast({ title: "Повторено", status: "info", duration: 1000 });
        }
        return;
      }

      // Duplicate: Ctrl+D / Cmd+D
      if (ctrlKey && e.key === "d" && selection.nodes.length > 0) {
        e.preventDefault();
        handleDuplicate();
        return;
      }

      // Copy: Ctrl+C / Cmd+C
      if (ctrlKey && e.key === "c" && selection.nodes.length > 0) {
        e.preventDefault();
        handleCopy();
        return;
      }

      // Cut: Ctrl+X / Cmd+X
      if (ctrlKey && e.key === "x" && selection.nodes.length > 0) {
        e.preventDefault();
        handleCut();
        return;
      }

      // Paste: Ctrl+V / Cmd+V
      if (ctrlKey && e.key === "v" && clipboard) {
        e.preventDefault();
        handlePaste();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, selection, clipboard, toast]);

  const deleteSelected = React.useCallback(() => {
    if (selection.nodes.length) {
      const ids = new Set(selection.nodes.map((n) => n.id));
      setNodes((nds) => nds.filter((n) => !ids.has(n.id)));
      setEdges((eds) => eds.filter((e) => !(ids.has(e.source) || ids.has(e.target))));
      setHasChanges(true);
    }
    if (selection.edges.length) {
      const eids = new Set(selection.edges.map((e) => e.id));
      setEdges((eds) => eds.filter((e) => !eids.has(e.id)));
      setHasChanges(true);
    }
  }, [selection, setNodes, setEdges]);

  // Duplicate selected nodes
  const handleDuplicate = React.useCallback(() => {
    if (selection.nodes.length === 0) return;

    const offset = 50;
    const newNodes = selection.nodes.map((node) => ({
      ...node,
      id: `${node._rawType}-${Date.now()}-${Math.random()}`,
      position: {
        x: node.position.x + offset,
        y: node.position.y + offset,
      },
      selected: false,
    }));

    setNodes((nds) => [...nds, ...newNodes]);
    setHasChanges(true);

    toast({
      title: `Дублировано нод: ${newNodes.length}`,
      status: "success",
      duration: 2000,
    });
  }, [selection.nodes, setNodes, toast]);

  // Copy nodes to clipboard
  const handleCopy = React.useCallback(() => {
    if (selection.nodes.length === 0) return;

    setClipboard({
      nodes: selection.nodes,
      edges: selection.edges,
    });

    toast({
      title: `Скопировано нод: ${selection.nodes.length}`,
      status: "info",
      duration: 2000,
    });
  }, [selection, toast]);

  // Cut nodes to clipboard
  const handleCut = React.useCallback(() => {
    if (selection.nodes.length === 0) return;

    setClipboard({
      nodes: selection.nodes,
      edges: selection.edges,
    });

    deleteSelected();

    toast({
      title: `Вырезано нод: ${selection.nodes.length}`,
      status: "info",
      duration: 2000,
    });
  }, [selection, deleteSelected, toast]);

  // Paste nodes from clipboard
  const handlePaste = React.useCallback(() => {
    if (!clipboard || clipboard.nodes.length === 0) return;

    const offset = 50;
    const idMap = {};

    const newNodes = clipboard.nodes.map((node) => {
      const newId = `${node._rawType}-${Date.now()}-${Math.random()}`;
      idMap[node.id] = newId;

      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + offset,
          y: node.position.y + offset,
        },
        selected: false,
      };
    });

    const newEdges = clipboard.edges
      .filter((edge) => idMap[edge.source] && idMap[edge.target])
      .map((edge) => ({
        ...edge,
        id: `e-${Date.now()}-${Math.random()}`,
        source: idMap[edge.source],
        target: idMap[edge.target],
      }));

    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
    setHasChanges(true);

    toast({
      title: `Вставлено нод: ${newNodes.length}`,
      status: "success",
      duration: 2000,
    });
  }, [clipboard, setNodes, setEdges, toast]);

  // Zoom to selection
  const handleZoomToSelection = React.useCallback(() => {
    if (selection.nodes.length === 0) return;

    const bounds = getNodesBounds(selection.nodes);
    const viewport = getViewportForBounds(
      bounds,
      reactFlowInstance.getViewport().zoom,
      reactFlowInstance.getViewport().x,
      reactFlowInstance.getViewport().y,
      0.2, // padding
    );

    reactFlowInstance.setViewport(viewport, { duration: 400 });
  }, [selection.nodes, reactFlowInstance]);

  // Alignment handlers
  const handleAlignLeft = React.useCallback(() => {
    if (selection.nodes.length < 2) return;
    const aligned = alignNodesVertically(selection.nodes, "left");
    const nodeMap = new Map(aligned.map((n) => [n.id, n]));
    setNodes((nds) => nds.map((n) => nodeMap.get(n.id) || n));
    setHasChanges(true);
    toast({ title: "Выровнено по левому краю", status: "success", duration: 1500 });
  }, [selection.nodes, setNodes, toast]);

  const handleAlignCenter = React.useCallback(() => {
    if (selection.nodes.length < 2) return;
    const aligned = alignNodesVertically(selection.nodes, "center");
    const nodeMap = new Map(aligned.map((n) => [n.id, n]));
    setNodes((nds) => nds.map((n) => nodeMap.get(n.id) || n));
    setHasChanges(true);
    toast({ title: "Выровнено по центру", status: "success", duration: 1500 });
  }, [selection.nodes, setNodes, toast]);

  const handleAlignRight = React.useCallback(() => {
    if (selection.nodes.length < 2) return;
    const aligned = alignNodesVertically(selection.nodes, "right");
    const nodeMap = new Map(aligned.map((n) => [n.id, n]));
    setNodes((nds) => nds.map((n) => nodeMap.get(n.id) || n));
    setHasChanges(true);
    toast({ title: "Выровнено по правому краю", status: "success", duration: 1500 });
  }, [selection.nodes, setNodes, toast]);

  const handleAlignTop = React.useCallback(() => {
    if (selection.nodes.length < 2) return;
    const aligned = alignNodesHorizontally(selection.nodes, "top");
    const nodeMap = new Map(aligned.map((n) => [n.id, n]));
    setNodes((nds) => nds.map((n) => nodeMap.get(n.id) || n));
    setHasChanges(true);
    toast({ title: "Выровнено по верхнему краю", status: "success", duration: 1500 });
  }, [selection.nodes, setNodes, toast]);

  const handleAlignMiddle = React.useCallback(() => {
    if (selection.nodes.length < 2) return;
    const aligned = alignNodesHorizontally(selection.nodes, "center");
    const nodeMap = new Map(aligned.map((n) => [n.id, n]));
    setNodes((nds) => nds.map((n) => nodeMap.get(n.id) || n));
    setHasChanges(true);
    toast({ title: "Выровнено по середине", status: "success", duration: 1500 });
  }, [selection.nodes, setNodes, toast]);

  const handleAlignBottom = React.useCallback(() => {
    if (selection.nodes.length < 2) return;
    const aligned = alignNodesHorizontally(selection.nodes, "bottom");
    const nodeMap = new Map(aligned.map((n) => [n.id, n]));
    setNodes((nds) => nds.map((n) => nodeMap.get(n.id) || n));
    setHasChanges(true);
    toast({ title: "Выровнено по нижнему краю", status: "success", duration: 1500 });
  }, [selection.nodes, setNodes, toast]);

  const handleDistributeHorizontally = React.useCallback(() => {
    if (selection.nodes.length < 3) {
      toast({ title: "Нужно минимум 3 ноды", status: "warning", duration: 2000 });
      return;
    }
    const distributed = distributeNodesHorizontally(selection.nodes);
    const nodeMap = new Map(distributed.map((n) => [n.id, n]));
    setNodes((nds) => nds.map((n) => nodeMap.get(n.id) || n));
    setHasChanges(true);
    toast({ title: "Распределено по горизонтали", status: "success", duration: 1500 });
  }, [selection.nodes, setNodes, toast]);

  const handleDistributeVertically = React.useCallback(() => {
    if (selection.nodes.length < 3) {
      toast({ title: "Нужно минимум 3 ноды", status: "warning", duration: 2000 });
      return;
    }
    const distributed = distributeNodesVertically(selection.nodes);
    const nodeMap = new Map(distributed.map((n) => [n.id, n]));
    setNodes((nds) => nds.map((n) => nodeMap.get(n.id) || n));
    setHasChanges(true);
    toast({ title: "Распределено по вертикали", status: "success", duration: 1500 });
  }, [selection.nodes, setNodes, toast]);

  // Context menu handlers
  const handleCanvasContextMenu = React.useCallback((event) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  }, []);

  const handleCloseContextMenu = React.useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleUpdateNode = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, ...newData }, _rawData: { ...n._rawData, ...newData } }
          : n,
      ),
    );
    setHasChanges(true);
  };

  const onNodesChanged = React.useCallback(
    (chs) => {
      // Track if node is being dragged
      const isDragging = chs.some((ch) => ch.type === "position" && ch.dragging);
      isDraggingRef.current = isDragging;

      onNodesChange(chs);
      setHasChanges(true);
    },
    [onNodesChange],
  );

  const onEdgesChanged = React.useCallback(
    (chs) => {
      onEdgesChange(chs);
      setHasChanges(true);
    },
    [onEdgesChange],
  );

  const onSelectionChange = React.useCallback(({ nodes: n = [], edges: e = [] }) => {
    setSelection({ nodes: n, edges: e });
  }, []);

  // Track when dragging ends to save to history
  const onNodeDragStop = React.useCallback(() => {
    isDraggingRef.current = false;
    // Save to history after drag completes
    setTimeout(() => {
      if (!isDraggingRef.current) {
        saveToHistory();
      }
    }, 100);
  }, [saveToHistory]);

  const selectedNode = React.useMemo(() => {
    return selection.nodes.length === 1 ? selection.nodes[0] : null;
  }, [selection]);

  return (
    <Box h="100vh" display="flex" flexDirection="column" bg="background.primary" overflow="hidden">
      {/* Toolbar */}
      <GraphToolbar
        graphName={name}
        onGraphNameChange={setName}
        onSave={saveGraph}
        onSaveAs={saveAsNew}
        onValidate={handleValidate}
        onExport={handleExport}
        onAutoLayout={handleAutoLayout}
        onToggleGrid={() => setGridEnabled(!gridEnabled)}
        onToggleMinimap={() => setMinimapEnabled(!minimapEnabled)}
        isSaving={isSaving}
        isValidating={isValidating}
        hasChanges={hasChanges}
        gridEnabled={gridEnabled}
        minimapEnabled={minimapEnabled}
      />

      {/* Main workspace */}
      <Box flex="1" display="flex" position="relative" overflow="hidden">
        {/* Nodes Palette (Left) */}
        <NodesPalette
          nodes={registry?.nodes || {}}
          isCollapsed={paletteCollapsed}
          onToggleCollapse={() => setPaletteCollapsed(!paletteCollapsed)}
        />

        {/* Canvas */}
        <Box
          flex="1"
          position="relative"
          bg="background.secondary"
          onDragOver={onDragOver}
          onDrop={onDrop}
          onContextMenu={handleCanvasContextMenu}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChanged}
            onEdgesChange={onEdgesChanged}
            onConnect={guardedOnConnect}
            nodeTypes={nodeTypes}
            onSelectionChange={onSelectionChange}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onNodeDragStop={onNodeDragStop}
            onPaneClick={() => setContextMenu(null)}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{
              type: "smoothstep",
              animated: true,
              style: { stroke: "#6366f1", strokeWidth: 2 },
            }}
            // Performance optimizations
            minZoom={0.1}
            maxZoom={4}
            snapToGrid={false}
            elevateNodesOnSelect={false}
          >
            {minimapEnabled && (
              <MiniMap
                nodeColor={(node) => {
                  if (node.selected) return "#6366f1";
                  return "#374151";
                }}
                maskColor="rgba(0, 0, 0, 0.6)"
              />
            )}
            {gridEnabled && <Background gap={16} size={1} />}
          </ReactFlow>
        </Box>

        {/* Properties Panel (Right) */}
        {selectedNode && (
          <PropertiesPanel
            selectedNode={selectedNode}
            onUpdateNode={handleUpdateNode}
            onClose={() => setSelection({ nodes: [], edges: [] })}
            isCollapsed={propertiesCollapsed}
            onToggleCollapse={() => setPropertiesCollapsed(!propertiesCollapsed)}
          />
        )}
      </Box>

      {/* Context Menu */}
      {contextMenu && (
        <GraphContextMenu
          position={contextMenu}
          onClose={handleCloseContextMenu}
          selection={selection}
          onCopy={handleCopy}
          onCut={handleCut}
          onPaste={handlePaste}
          onDelete={deleteSelected}
          onDuplicate={handleDuplicate}
          onZoomToSelection={handleZoomToSelection}
          hasClipboard={clipboard !== null}
        />
      )}

      {/* Alignment Tools - Floating Button */}
      {selection.nodes.length >= 2 && (
        <Box position="absolute" bottom="20px" right="20px" zIndex={10}>
          <AlignmentMenu
            onAlignLeft={handleAlignLeft}
            onAlignCenter={handleAlignCenter}
            onAlignRight={handleAlignRight}
            onAlignTop={handleAlignTop}
            onAlignMiddle={handleAlignMiddle}
            onAlignBottom={handleAlignBottom}
            onDistributeHorizontally={handleDistributeHorizontally}
            onDistributeVertically={handleDistributeVertically}
            disabled={false}
          />
        </Box>
      )}
    </Box>
  );
}

export default GraphBuilderPage;
