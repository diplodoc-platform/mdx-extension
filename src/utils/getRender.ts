import { type CompileOptions, compileSync } from "@mdx-js/mdx";
import type { MdxArtifacts } from "../types";
import { MDX_PREFIX, TAG_NAME } from "../constants";

interface GetRenderProps {
  compileOptions?: CompileOptions;
}

const getRender = ({ compileOptions }: GetRenderProps = {}) => {
  let idx = 0;

  const getHtml = (mdx: string, mdxArtifacts: MdxArtifacts) => {
    const { idMdx } = mdxArtifacts;

    const id = `${MDX_PREFIX}${++idx}`;
    const vFile = compileSync(mdx, {
      ...compileOptions,
      outputFormat: "function-body",
    });
    const code = vFile.toString();
    idMdx[id] = code;
    return `<${TAG_NAME} class="${id}"></${TAG_NAME}>`;
  };

  return getHtml;
};

export default getRender;
