import { Image } from "@chakra-ui/react";
import logo from "./logo.svg";
import transparentLogo from "./transparent_logo.svg";

const nameProject = "MLservice";

const VARIANT_SOURCES = {
  solid: logo,
  transparent: transparentLogo,
};

function Logo({ boxSize = 6, variant = "solid", ...rest }) {
  const src = VARIANT_SOURCES[variant] ?? VARIANT_SOURCES.solid;

  return <Image src={src} alt={`${nameProject} logo`} title={nameProject} boxSize={boxSize} {...rest} />;
}

export default Logo;
