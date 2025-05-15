import type { MDXComponents, MDXProps } from "mdx/types";
import { compileSync, runSync } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import React from "react";
import type { MdxArtifacts } from "../types";
import { MDX_PREFIX } from "../constants";
import { renderToString } from "react-dom/server";

interface GetSsrRendererProps {
  components?: MDXComponents;
}

const getSsrRenderer = async ({ components }: GetSsrRendererProps) => {
  const render = (id: string, mdx: string, props?: MDXProps) => {
    const vFile = compileSync(mdx, {
      outputFormat: "function-body",
    });

    const { default: Component } = runSync(vFile, {
      ...runtime,
    });

    const code = vFile.toString();

    const options = {
      identifierPrefix: id,
    };
    const html = renderToString(
      React.createElement("span", {
        className: id,
        children: React.createElement(Component, props),
      }),
      options,
    );

    return { html, code };
  };

  let idx = 0;

  const getHtml = (mdx: string, mdxArtifacts: MdxArtifacts) => {
    const { idMdx } = mdxArtifacts;
    const id = `${MDX_PREFIX}${++idx}`;
    const { html, code } = render(id, mdx, {
      components,
    });
    idMdx[id] = code;
    return html;
  };

  return getHtml;
};

export default getSsrRenderer;
