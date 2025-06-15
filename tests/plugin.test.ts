import type {RuleCore} from 'markdown-it/lib/parser_core.js';
import md, {type PluginSimple} from 'markdown-it';
import mdxPlugin, {type MarkdownItWithTestEnv} from '../src/mdx-plugin';

type StateCore = Parameters<RuleCore>[0];

describe('corePlugin', () => {
    let corePlugin: RuleCore;
    let idMdxBody: MarkdownItWithTestEnv['env']['idMdxBody'];

    beforeEach(() => {
        const mdx = mdxPlugin({isTestMode: true}) as unknown as PluginSimple;
        const markdown = md().use(mdx) as unknown as MarkdownItWithTestEnv;
        idMdxBody = markdown.env.idMdxBody;
        corePlugin = markdown.env.corePlugin;
    });

    it('should replace simple MDX tags with placeholders', () => {
        const state = {
            src: 'Some text <MDX><Component>content</Component></MDX> more text',
            tokens: [],
        } as unknown as StateCore;

        corePlugin(state);

        expect(state.src).toMatch(/<MDX>\d+<\/MDX>/);
        const id = state.src.match(/<MDX>(\d+)<\/MDX>/)?.[1] || -1;
        expect(idMdxBody[id].content).toBe('<Component>content</Component>');
        expect(idMdxBody[id].fragment).toBe('<MDX><Component>content</Component></MDX>');
    });

    it('should replace simple JSX tags with placeholders', () => {
        const state = {
            src: 'Some text <Component>content</Component> more text',
            tokens: [],
        } as unknown as StateCore;

        corePlugin(state);

        expect(state.src).toMatch(/<MDX>\d+<\/MDX>/);
        const id = state.src.match(/<MDX>(\d+)<\/MDX>/)?.[1] || -1;
        expect(idMdxBody[id].content).toBe('<Component>content</Component>');
        expect(idMdxBody[id].fragment).toBe('<Component>content</Component>');
    });

    it('should replace JSX with children tags with placeholders', () => {
        const state = {
            src: 'Some text <Component><ComponentItem>content</ComponentItem></Component> more text',
            tokens: [],
        } as unknown as StateCore;

        corePlugin(state);

        expect(state.src).toMatch(/<MDX>\d+<\/MDX>/);
        const id = state.src.match(/<MDX>(\d+)<\/MDX>/)?.[1] || -1;
        expect(idMdxBody[id].content).toBe(
            '<Component><ComponentItem>content</ComponentItem></Component>',
        );
        expect(idMdxBody[id].fragment).toBe(
            '<Component><ComponentItem>content</ComponentItem></Component>',
        );
    });

    it('should handle self-closing JSX tags', () => {
        const state = {
            src: 'Text <SelfClosing /> and more text',
            tokens: [],
        } as unknown as StateCore;

        corePlugin(state);

        expect(state.src).toMatch(/<MDX>\d+<\/MDX>/);
        const id = state.src.match(/<MDX>(\d+)<\/MDX>/)?.[1] || -1;
        expect(idMdxBody[id].content).toBe('<SelfClosing />');
        expect(idMdxBody[id].fragment).toBe('<SelfClosing />');
    });

    it('should handle empty fragments', () => {
        const state = {
            src: 'Text <>content</> more text',
            tokens: [],
        } as unknown as StateCore;

        corePlugin(state);

        expect(state.src).toMatch(/<MDX>\d+<\/MDX>/);
        const id = state.src.match(/<MDX>(\d+)<\/MDX>/)?.[1] || -1;
        expect(idMdxBody[id].content).toBe('<>content</>');
        expect(idMdxBody[id].fragment).toBe('<>content</>');
    });

    it('should ignore non-JSX tags', () => {
        const src = 'Text <div>html</div> more text';
        const state = {
            src,
            tokens: [],
        } as unknown as StateCore;

        corePlugin(state);

        expect(state.src).toBe(src);
    });
});

describe('corePluginWithTagNameList', () => {
    let corePlugin: RuleCore;
    let idMdxBody: MarkdownItWithTestEnv['env']['idMdxBody'];

    beforeEach(() => {
        const mdx = mdxPlugin({isTestMode: true, tagNames: ['MDX']}) as unknown as PluginSimple;
        const markdown = md().use(mdx) as unknown as MarkdownItWithTestEnv;
        idMdxBody = markdown.env.idMdxBody;
        corePlugin = markdown.env.corePlugin;
    });

    it('should ignore fragment tag', () => {
        const state = {
            src: 'Text <>content</> more text',
            tokens: [],
        } as unknown as StateCore;

        corePlugin(state);

        expect(state.src).toBe('Text <>content</> more text');
    });

    it('should not ignore fragment tag', () => {
        const state = {
            src: 'Text <MDX><>content</></MDX> more text',
            tokens: [],
        } as unknown as StateCore;

        corePlugin(state);

        expect(state.src).toMatch(/<MDX>\d+<\/MDX>/);
        const id = state.src.match(/<MDX>(\d+)<\/MDX>/)?.[1] || -1;
        expect(idMdxBody[id].content).toBe('<>content</>');
        expect(idMdxBody[id].fragment).toBe('<MDX><>content</></MDX>');
    });
});
