const path = require("path");

const resolveSrc = (segment = "") => path.join(__dirname, "src", segment);

const alias = {
  "@ui": resolveSrc("ui"),
  "@features": resolveSrc("features"),
  "@pages": resolveSrc("pages"),
  "@utils": resolveSrc("utils"),
  "@theme": resolveSrc("theme"),
  "@context": resolveSrc("context"),
  "@constants": resolveSrc("constants"),
  "@api": resolveSrc("API"),
  "@hooks": resolveSrc("hooks"),
};

const moduleNameMapper = Object.entries(alias).reduce((mapper, [key, target]) => {
  const escapedKey = key.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  mapper[`^${escapedKey}/(.*)$`] = `${target}/$1`;
  mapper[`^${escapedKey}$`] = target;
  return mapper;
}, {});

module.exports = {
  webpack: {
    alias,
  },
  jest: {
    configure: {
      moduleNameMapper,
    },
  },
};
