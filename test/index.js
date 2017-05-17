import test from 'tape'
import isFunction from 'is-function'
import {convertToRaw, ContentBlock, ContentState, EditorState} from 'draft-js'
import createBlockBreakoutPlugin from '../src'

test('it should create a draft-js plugin', (nest) => {
  const blockBreakoutPlugin = createBlockBreakoutPlugin()

  nest.test('... with the correct exports', (assert) => {
    assert.ok(isFunction(blockBreakoutPlugin.handleReturn), 'handleReturn is a function')
    assert.end()
  })
})

test('it should break out of `breakoutBlocks`', (t) => {
  const {handleReturn} = createBlockBreakoutPlugin()
  const contentState = ContentState.createFromBlockArray([new ContentBlock({
    key: '1',
    type: 'header-one',
    text: 'test'
  })])
  let editorState = EditorState.moveSelectionToEnd(
    EditorState.createWithContent(contentState))
  const getEditorState = () => editorState
  const setEditorState = (state) => { editorState = state }
  t.equal(handleReturn(undefined, {getEditorState, setEditorState}), 'handled')
  const serialized = convertToRaw(editorState.getCurrentContent())
  t.equal(serialized.blocks.length, 2)
  t.equal(serialized.blocks[0].type, 'header-one')
  t.equal(serialized.blocks[0].text, 'test')
  t.equal(serialized.blocks[1].type, 'unstyled')
  t.equal(serialized.blocks[1].text, '')
  t.end()
})

test('it prints an error when a block is redundantly specified', (t) => {
  const originalConsoleError = console.error
  const errors = []
  console.error = (e) => errors.push(e)
  createBlockBreakoutPlugin({
    breakoutBlocks: ['blockquote'],
    doubleBreakoutBlocks: ['blockquote']
  })
  t.equal(errors.length, 1)
  t.equal(errors[0], 'The block `blockquote` was redundantly specified in `breakoutBlocks` as well as `doubleBreakoutBlocks`. This is probably an error.')
  t.end()
  console.error = originalConsoleError
})

test('it treats a block is a regular breakout block if it is redundantly specified', (t) => {
  const originalConsoleError = console.error
  const errors = []
  console.error = () => {}
  const {handleReturn} = createBlockBreakoutPlugin({
    breakoutBlocks: ['blockquote'],
    doubleBreakoutBlocks: ['blockquote']
  })
  const contentState = ContentState.createFromBlockArray([new ContentBlock({
    key: '1',
    type: 'blockquote',
    text: 'test'
  })])
  let editorState = EditorState.moveSelectionToEnd(
    EditorState.createWithContent(contentState))
  const getEditorState = () => editorState
  const setEditorState = (state) => { editorState = state }
  t.equal(handleReturn(undefined, {getEditorState, setEditorState}), 'handled')
  const serialized = convertToRaw(editorState.getCurrentContent())
  t.equal(serialized.blocks.length, 2)
  t.equal(serialized.blocks[0].type, 'blockquote')
  t.equal(serialized.blocks[0].text, 'test')
  t.equal(serialized.blocks[1].type, 'unstyled')
  t.equal(serialized.blocks[1].text, '')
  t.end()
  console.error = originalConsoleError
})
