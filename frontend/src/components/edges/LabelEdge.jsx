import React from "react";
import { BaseEdge, EdgeLabelRenderer, getStraightPath, useReactFlow } from "@xyflow/react";

export default function LabelEdge({ id, sourceX, sourceY, targetX, targetY }) {
  const { deleteElements } = useReactFlow();
  const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <button
          onClick={() => deleteElements({ edges: [{ id }] })}
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
            background: "#2B6CB0",
            color: "white",
            border: "none",
            borderRadius: 4,
            padding: "2px 6px",
            fontSize: 12,
          }}
          className="nodrag nopan"
        >
          delete
        </button>
      </EdgeLabelRenderer>
    </>
  );
}
