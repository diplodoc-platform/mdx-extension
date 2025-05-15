import React from "react";
import type { MdxArtifacts } from "../types";
import { idMdxToComponents, renderMdxComponents } from "../utils/common";
import type { MDXComponents } from "mdx/types";

interface UseMdxProps {
  html: string;
  refCtr: React.MutableRefObject<HTMLElement | null>;
  components?: MDXComponents;
  mdxArtifacts?: MdxArtifacts;
}

const useMdx = ({ refCtr, html, components, mdxArtifacts }: UseMdxProps) => {
  const refUmount = React.useRef(() => {});

  // building mdx scripts into components
  const idMdxComponent = React.useMemo(
    () => idMdxToComponents(mdxArtifacts?.idMdx),
    [mdxArtifacts?.idMdx],
  );

  // render new html
  React.useLayoutEffect(() => {
    const ctr = refCtr.current;
    if (!ctr) {
      throw new Error("ctr is null");
    }

    const dom = new DOMParser().parseFromString(
      `<html lang="en"><body>${html}</body></html>`,
      "text/html",
    );

    const bodyNode = dom.querySelector("body");
    if (!bodyNode) {
      throw new Error("bodyNode is null");
    }

    const fragment = document.createDocumentFragment();
    fragment.append(...Array.from(bodyNode.childNodes.values()));

    ctr.textContent = null;
    ctr.appendChild(fragment);

    // umount mdx components when html or refCtr changes
    return () => refUmount.current();
  }, [refCtr, html]);

  // render mdx
  React.useLayoutEffect(() => {
    const ctr = refCtr.current;
    if (!ctr) {
      throw new Error("ctr is null");
    }

    refUmount.current = renderMdxComponents({
      idMdxComponent,
      ctr,
      components,
    });
  }, [refCtr, html, components, idMdxComponent]);
};

export default useMdx;
