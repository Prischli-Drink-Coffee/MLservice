import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Box, VStack, Flex } from "@chakra-ui/react";

const RawMotionBox = motion(Box);
const RawMotionVStack = motion(VStack);
const RawMotionFlex = motion(Flex);

// Helper to strip animation props when user prefers reduced motion
function stripMotionProps(props) {
  const { initial, animate, exit, whileHover, whileTap, transition, whileInView, ...rest } = props;
  return rest;
}

export const MotionBox = React.forwardRef(
  ({ initial, animate, exit, whileHover, whileTap, transition, whileInView, ...props }, ref) => {
    const shouldReduce = useReducedMotion();
    const safeProps = shouldReduce
      ? stripMotionProps(props)
      : { initial, animate, exit, whileHover, whileTap, transition, whileInView, ...props };
    return <RawMotionBox ref={ref} {...safeProps} />;
  },
);

export const MotionVStack = React.forwardRef(
  ({ initial, animate, exit, whileHover, whileTap, transition, whileInView, ...props }, ref) => {
    const shouldReduce = useReducedMotion();
    const safeProps = shouldReduce
      ? stripMotionProps(props)
      : { initial, animate, exit, whileHover, whileTap, transition, whileInView, ...props };
    return <RawMotionVStack ref={ref} {...safeProps} />;
  },
);

export const MotionFlex = React.forwardRef(
  ({ initial, animate, exit, whileHover, whileTap, transition, whileInView, ...props }, ref) => {
    const shouldReduce = useReducedMotion();
    const safeProps = shouldReduce
      ? stripMotionProps(props)
      : { initial, animate, exit, whileHover, whileTap, transition, whileInView, ...props };
    return <RawMotionFlex ref={ref} {...safeProps} />;
  },
);

MotionBox.displayName = "MotionBox";
MotionVStack.displayName = "MotionVStack";
MotionFlex.displayName = "MotionFlex";
