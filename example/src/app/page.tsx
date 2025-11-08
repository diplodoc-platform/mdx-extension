import React from 'react';
import Home from '@/Components/Home/Home';
// @ts-ignore
import {Worker, spawn} from 'threads';
import {CONTENT} from '@/constants';
import type {SsrRendererWorker} from '@/workers/ssrRenderer/ssrRenderer';
import assert from 'node:assert';

let worker: SsrRendererWorker | undefined;

const getContent = async () => {
    // next.js don't allow manual render, so, use worker
    if (!worker) {
        worker = await spawn<SsrRendererWorker>(new Worker('../ssrRendererWorker'));
    }
    assert(worker);

    return worker.getContent(CONTENT);
};

export default async function Page() {
    const {html, mdxArtifacts} = await getContent();

    return <Home html={html} mdxArtifacts={mdxArtifacts} withLoader />;
}
