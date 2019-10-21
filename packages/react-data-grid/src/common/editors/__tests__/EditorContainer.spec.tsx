import React from 'react';
import ReactDOM from 'react-dom';
import { mount, MountRendererProps } from 'enzyme';

import EditorContainer, { Props } from '../EditorContainer';
import SimpleTextEditor from '../SimpleTextEditor';
import { valueCellContentRenderer } from '../../../Cell/cellContentRenderers';
import { CalculatedColumn, EditorProps } from '../../types';

interface Row {
  id: string;
  col1: string;
  col2: string;
  col3: string;
}

function DefaultEditor() {
  return (
    <div>
      <input type="text" id="input1" />
      <div>
        <input type="text" id="input2" />
        <button
          type="button"
          id="button1"
          onClick={e => e.stopPropagation()}
        />
        <button
          type="button"
          id="button2"
          onClickCapture={e => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

const fakeColumn: CalculatedColumn<Row> = {
  idx: 0,
  name: 'col1',
  key: 'col1',
  width: 100,
  left: 0,
  cellContentRenderer: valueCellContentRenderer
};

const setup = (extraProps?: Partial<Props<Row, 'id'>>, opts?: MountRendererProps) => {
  const props: Props<Row, 'id'> = {
    rowIdx: 0,
    rowData: {
      id: '1',
      col1: 'I',
      col2: 'love',
      col3: 'Testing'
    },
    column: fakeColumn,
    value: 'Adwolf',
    width: 100,
    height: 50,
    left: 0,
    top: 0,
    onCommit: jest.fn(),
    onCommitCancel: jest.fn(),
    firstEditorKeyPress: null,
    scrollLeft: 0,
    scrollTop: 0,
    ...extraProps
  };
  const wrapper = mount<EditorContainer<Row, 'id'>>(<EditorContainer {...props} />, opts);

  return { wrapper, props };
};

describe('Editor Container Tests', () => {
  describe('Basic render tests', () => {
    it('should select the text of the default input when the editor is rendered', () => {
      const { wrapper } = setup();
      const input = wrapper.instance().getInputNode() as HTMLInputElement;
      expect(input.selectionStart === 0 && input.selectionEnd === input.value.length).toBe(true);
    });

    it('should render the editor with the correct properties', () => {
      const { wrapper } = setup();
      const editor = wrapper.find(SimpleTextEditor);

      expect(editor.length).toBe(1);
      expect(editor.props().value).toEqual('Adwolf');
      expect(editor.props().column).toEqual(fakeColumn);
    });

    it('should render the editor container div with correct properties', () => {
      const { wrapper } = setup();
      const editorDiv = wrapper.find('div').at(0);

      expect(editorDiv.props().className).toBeDefined();
      expect(editorDiv.props().onKeyDown).toBeDefined();
      expect(editorDiv.props().children).toBeDefined();
    });
  });

  describe('Custom Editors', () => {
    class TestEditor extends React.Component<EditorProps<Row[keyof Row]>> {
      getValue() {
        return undefined;
      }

      getInputNode() {
        return undefined;
      }

      render() {
        return <DefaultEditor />;
      }
    }

    function innerSetup() {
      return setup({
        value: 'SupernaviX',
        column: { ...fakeColumn, editor: TestEditor }
      });
    }

    it('should render element custom editors', () => {
      const { wrapper } = innerSetup();
      const editor = wrapper.find(TestEditor);

      expect(editor.length).toBe(1);
      expect(editor.prop('value')).toBe('SupernaviX');
      expect(editor.prop('onCommit')).toBeDefined();
      expect(editor.prop('onCommitCancel')).toBeDefined();
    });

    it('should not commit if any element inside the editor is clicked', () => {
      const { wrapper, props } = innerSetup();
      wrapper.find('#input1').simulate('click');
      wrapper.find('#input2').simulate('click');

      expect(props.onCommit).not.toHaveBeenCalled();
    });

    it('should not commit if any element inside the editor is clicked that stops the event propagation', () => {
      const { wrapper, props } = innerSetup();
      wrapper.find('#button1').simulate('click');
      wrapper.find('#button2').simulate('click');

      expect(props.onCommit).not.toHaveBeenCalled();
    });

    it('should call onCommitCancel when editor cancels editing', () => {
      const { wrapper, props } = innerSetup();
      const editor = wrapper.find(TestEditor);

      editor.props().onCommitCancel();

      expect(props.onCommitCancel).toHaveBeenCalledTimes(1);
      expect(props.onCommit).not.toHaveBeenCalled();
    });

    it('should not commit changes on componentWillUnmount if editor cancels editing', () => {
      const { wrapper, props } = innerSetup();
      const editor = wrapper.find(TestEditor);

      editor.props().onCommitCancel();
      wrapper.unmount();

      expect(props.onCommit).not.toHaveBeenCalled();
    });
  });

  describe('Custom Portal editors', () => {
    class PortalTestEditor extends React.Component {
      getValue() {
        return undefined;
      }

      getInputNode() {
        return undefined;
      }

      render() {
        return ReactDOM.createPortal(<DefaultEditor />, document.body);
      }
    }

    function innerSetup() {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const setupResult = setup({ column: { ...fakeColumn, editor: <PortalTestEditor /> } }, { attachTo: container });
      return { container, ...setupResult };
    }

    it('should not commit if any element inside the editor is clicked', () => {
      const { wrapper, props } = innerSetup();
      const editor = wrapper.find(PortalTestEditor);
      editor.find('#input1').simulate('click');
      editor.find('#input2').simulate('click');

      expect(props.onCommit).not.toHaveBeenCalled();
    });

    it('should not commit if any element inside the editor is clicked that stops the event propagation', () => {
      const { wrapper, props } = innerSetup();
      wrapper.find('#button1').simulate('click');
      wrapper.find('#button2').simulate('click');

      expect(props.onCommit).not.toHaveBeenCalled();
    });

    it('should commit if any element outside the editor is clicked', () => {
      const { props } = innerSetup();
      document.body.click();
      expect(props.onCommit).toHaveBeenCalled();
    });
  });

  describe('Events', () => {
    it('hitting enter should call commit only once', () => {
      const { wrapper, props } = setup();
      const editor = wrapper.find(SimpleTextEditor);
      editor.simulate('keydown', { key: 'Enter' });

      expect(props.onCommit).toHaveBeenCalledTimes(1);
    });

    it('hitting tab should call commit only once', () => {
      const { wrapper, props } = setup();
      const editor = wrapper.find(SimpleTextEditor);
      editor.simulate('keydown', { key: 'Tab' });

      expect(props.onCommit).toHaveBeenCalledTimes(1);
    });

    it('hitting escape should call commitCancel only once', () => {
      const { wrapper, props } = setup();
      const editor = wrapper.find(SimpleTextEditor);
      editor.simulate('keydown', { key: 'Escape' });

      expect(props.onCommitCancel).toHaveBeenCalledTimes(1);
    });

    it('hitting escape should not call commit changes on componentWillUnmount', () => {
      const { wrapper, props } = setup();
      const editor = wrapper.find(SimpleTextEditor);
      editor.simulate('keydown', { key: 'Escape' });
      wrapper.unmount();

      expect(props.onCommit).not.toHaveBeenCalled();
    });

    it('should commit if any element outside the editor is clicked', () => {
      const { props } = setup();
      document.body.click();
      expect(props.onCommit).toHaveBeenCalled();
    });
  });
});
