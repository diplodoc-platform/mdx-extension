import { compileSync } from "@mdx-js/mdx";
import type { MdxArtifacts } from "../types";
import { MDX_PREFIX } from "../constants";

const getRender = () => {
  let idx = 0;

  const getHtml = (mdx: string, mdxArtifacts: MdxArtifacts) => {
    const { idMdx } = mdxArtifacts;

    const id = `${MDX_PREFIX}${++idx}`;
    const vFile = compileSync(mdx, {
      outputFormat: "function-body",
    });
    const code = vFile.toString();
    idMdx[id] = code;
    return `<span class="${id}"></span>`;
  };

  return getHtml;
};

export default getRender;
