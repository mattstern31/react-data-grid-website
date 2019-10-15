import React from 'react';
import TestUtils from 'react-dom/test-utils';

import DropDownEditor from '../DropDownEditor';

describe('DropDownEditor', () => {
  let component;

  describe('Basic tests', () => {
    const fakeOptions = ['option1', 'option2', 'option3'];
    const fakeColumn = { key: 'selected' };
    function fakeCommitCb() { return true; }

    beforeEach(() => {
      component = TestUtils.renderIntoDocument(
        <DropDownEditor
          name="DropDownEditor"
          options={fakeOptions}
          value="option2"
          onCommit={fakeCommitCb}
          column={fakeColumn}
        />
      );
    });

    it('should pass the value to the select node as an inline value', () => {
      const Select = TestUtils.findRenderedDOMComponentWithTag(component, 'select');
      expect(Select.value).toBe('option2');
    });

    it('should render the options as ReactElements', () => {
      const firstOption = component.renderOptions()[0];
      expect(TestUtils.isElement(firstOption)).toBe(true);
    });

    it('should pass the option name as the key and value of each ReactElement', () => {
      const optionsArray = component.renderOptions();
      expect(optionsArray[0].type).toBe('option');
      expect(optionsArray[1].key).toBe('option2');
      expect(optionsArray[2].props.value).toBe('option3');
    });

    it('should return the selected option on getValue', () => {
      expect(component.getValue().selected).toBe('option2');
    });
  });

  describe('Object parameters', () => {
    const fakeOptions = [
      { id: '1', value: 'option1', title: 'Option 1' },
      { id: '2', value: 'option2', text: 'Option Two' },
      { id: '3', value: 'option3', title: 'Option 3', text: 'Option Three' }
    ];
    const fakeColumn = { key: 'selected' };
    function fakeCommitCb() { return true; }

    beforeEach(() => {
      component = TestUtils.renderIntoDocument(
        <DropDownEditor
          name="DropDownEditor"
          options={fakeOptions}
          value="Choose a thing"
          onCommit={fakeCommitCb}
          column={fakeColumn}
        />
      );
    });

    it('should display value unless text is specified', () => {
      const option = component.renderOptions()[0];
      expect(option.key).toBe('1');
      expect(option.props.value).toBe('option1');
      expect(option.props.title).toBe('Option 1');
      expect(option.props.children).toBe('option1');
    });

    it('should display text', () => {
      const option = component.renderOptions()[1];
      expect(option.key).toBe('2');
      expect(option.props.value).toBe('option2');
      expect(option.props.title).not.toBeDefined();
      expect(option.props.children).toBe('Option Two');
    });

    it('should display title', () => {
      const option = component.renderOptions()[2];
      expect(option.key).toBe('3');
      expect(option.props.value).toBe('option3');
      expect(option.props.title).toBe('Option 3');
      expect(option.props.children).toBe('Option Three');
    });
  });
});
