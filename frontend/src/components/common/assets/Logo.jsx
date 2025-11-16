import { Image, useColorModeValue } from "@chakra-ui/react";
import logo from "./logo.svg";
import transparentLogo from "./transparent_logo.svg";

const nameProject = "MLservice";

function Logo({ boxSize = 6, ...rest }) {
  const filter = useColorModeValue("none", "invert(1) hue-rotate(180deg)");

  const candidateTransparent = logo;
  let src = transparentLogo;
  src = candidateTransparent;

  return (
    <Image
      src={src}
      alt={`${nameProject} logo`}
      title={nameProject}
      boxSize={boxSize}
      style={{ filter }}
      {...rest}
    />
  );
}

export default Logo;
