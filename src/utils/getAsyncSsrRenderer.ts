import type { MDXComponents } from "mdx/types";
import { type CompileOptions, compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import React from "react";
import type { MdxArtifacts } from "../types";
import { MDX_PREFIX, TAG_NAME } from "../constants";
import { renderToString } from "react-dom/server";
import { escapeAttribute, isEmptyObject } from "./common";
import { MdxSetStateCtx, MdxStateCtx, type MdxStateCtxValue } from "../context";
import { generateUniqueId, getComponentInitProps } from "./asyncRenderTools";

interface GetSsrRendererProps {
  components?: MDXComponents;
  pureComponents?: MDXComponents;
  compileOptions?: CompileOptions;
}

const getAsyncSsrRenderer = async ({
  components,
  pureComponents,
  compileOptions,
}: GetSsrRendererProps) => {
  const componentsNames = Object.keys(components || {});

  const allComponents = {
    ...components,
    ...pureComponents,
  };

  const render = async (id: string, mdx: string) => {
    const vFile = await compile(mdx, {
      ...compileOptions,
      outputFormat: "function-body",
    });

    const { initComponents, usedComponents, renderComponents } =
      await getComponentInitProps(allComponents, vFile);

    await initComponents();

    const { default: Component } = await run(vFile, runtime);

    let code: string | undefined = vFile.toString();

    const state = {};
    const setState = (value: MdxStateCtxValue) => {
      Object.assign(state, value);
    };

    const options = {
      identifierPrefix: id,
    };

    let html = renderToString(
      React.createElement(TAG_NAME, {
        className: id,
        children: React.createElement(MdxSetStateCtx.Provider, {
          value: setState,
          children: React.createElement(MdxStateCtx.Provider, {
            value: state,
            children: React.createElement(Component, {
              components: renderComponents,
            }),
          }),
        }),
      }),
      options,
    );
    if (!isEmptyObject(state)) {
      html = html.replace(
        `${TAG_NAME} `,
        `${TAG_NAME} data-mdx-state="${escapeAttribute(JSON.stringify(state))}" `,
      );
    }
    const withComponents = componentsNames.some((name) =>
      usedComponents.has(name),
    );
    if (!withComponents) {
      const endOpenSpan = html.indexOf(">");
      const startCloseSpan = html.lastIndexOf("<");
      html = html.slice(endOpenSpan + 1, startCloseSpan);
      code = undefined;
    }

    return { html, code };
  };

  const idFragment = new Map<string, { replacer: string; mdx: string }>();

  const getHtmlAsync = async (
    inputOrig: string,
    mdxArtifacts: MdxArtifacts,
  ) => {
    let input = inputOrig;
    const { idMdx } = mdxArtifacts;

    for (const [id, { replacer, mdx }] of idFragment.entries()) {
      const { html, code } = await render(id, mdx);
      input = input.replace(replacer, () => html);
      if (code) {
        idMdx[id] = code;
      }
    }

    return input;
  };

  let idx = 0;

  const getHtml = (mdx: string) => {
    const id = `${MDX_PREFIX}${++idx}`;
    const replacer = `<${TAG_NAME} class="${id}">${generateUniqueId()}</${TAG_NAME}>`;
    idFragment.set(id, { replacer, mdx });
    return replacer;
  };

  return { render: getHtml, renderAsync: getHtmlAsync };
};

export default getAsyncSsrRenderer;
