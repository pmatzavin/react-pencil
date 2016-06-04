import React from 'react';
import {render} from 'react-dom';
import autosizeInput from 'autosize-input';

const {Component, PropTypes} = React;

const commonPropTypes = {
  finishEdit: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  tabIndex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  value: PropTypes.string
};

const commonDefaultProps = {};

function moveCursorToEnd(el) {
  if (el && el.tagName.toLowerCase().match(/input|textarea/)) {
    el.focus();
    if (el.setSelectionRange) {
      const len = el.value.length * 2;
      el.setSelectionRange(len, len);
    } else {
      el.value = el.value;
    }
    el.scrollTop = 999999;
  } else if (document.createRange) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}


class Singleline extends Component {

  componentDidMount() {
    this.autosize();
  }

  componentDidUpdate() {
    this.autosize();
  }

  componentWillUnmount() {
    if (this._delayedFocus) {
      global.clearTimeout(this._delayedFocus);
    }
  }

  autosize() {
    autosizeInput(this.refs.content);
  }

  focus() {
    this._delayedFocus = global.setTimeout(() => {
      moveCursorToEnd(this.refs.content);
      this.refs.content.focus();
    }, 110);
  }

  blur() {
    this.refs.content.blur();
  }

  onKeyUp(e) {
    if (e.keyCode === 27 || e.keyCode === 13) {
      this.blur();
    }
  }

  onBlur(e) {
    this.props.finishEdit(e.target.value);
  }

  render() {
    const {value, name, style, ...rest} = this.props;
    return (
      <input type='text'
             ref='content'
             name={name}
             autoComplete='off'
             defaultValue={value}
             style={style}
             onBlur={this.onBlur.bind(this)}
             onKeyUp={this.onKeyUp.bind(this)}
             {...rest}
      />
    );
  }
}

Object.assign(Singleline, {
  propTypes: commonPropTypes,
  defaultProps: commonDefaultProps
});


class Multiline extends Component {

  focus() {
    this._wasClicked = true;
    this.refs.content.focus();
  }

  blur() {
    this.refs.content.blur();
  }

  selectAll() {
    if (typeof global.document.execCommand === 'function') {
      // Mimic input behavior when navigating to element with TAB key.
      setTimeout(() => {
        if (!this._wasClicked) {
          global.document.execCommand('selectAll', false, null);
        }
      }, 50);
    }
  }

  onFocus() {
    this.selectAll();
    moveCursorToEnd(this.refs.content);
  }

  onClick() {
    this._wasClicked = true;
    this.focus();
  }

  onKeyDown(e) {
    if (e.keyCode === 27 || e.keyCode === 13) {
      e.preventDefault();
      this.blur();
    }
  }

  onBlur(e) {
    this._wasClicked = false;
    this.props.finishEdit(e.target.innerText);
  }

  ensureEmptyContent() {
    if (!this.props.value) {
      this.refs.contentinnerHTML = '';
    }
  }

  render() {
    const {value, style, ...rest} = this.props;
    return (
      <span ref='content'
            contentEditable='true'
            style={style}
            onFocus={this.onFocus.bind(this)}
            onBlur={this.onBlur.bind(this)}
            onClick={this.onClick.bind(this)}
            onKeyDown={this.onKeyDown.bind(this)}
            dangerouslySetInnerHTML={{__html: value || null}}
            {...rest}
      >
      </span>
    );
  }
}

Object.assign(Multiline, {
  propTypes: commonPropTypes,
  defaultProps: commonDefaultProps
});


class ReactPencil extends Component {

  focus() {
    this.refs.editable.focus();
  }

  finishEdit(newValue) {
    const {oldValue = '', name, multiline} = this.props;
    newValue = newValue.trim();

    if (newValue !== oldValue) {
      this.props.onEditDone(name, newValue);
    }
    if (multiline) {
      this.refs.editable.ensureEmptyContent();
    }
  }

  renderPencilButton() {
    return (
      <button className='pencil-button' onClick={() => this.focus()}>
        <i className='pencil-icon'></i>
      </button> : null
    );
  }

  renderError(error) {
    return <span className='error-msg'>{error}</span>
  }

  render() {
    const {multiline, pencil, error} = this.props;
    const Component = multiline ? Multiline : Singleline;
    return (
      <div className={`react-pencil ${error ? 'error' : ''}`}>
        <Component ref='editable' {...this.props} finishEdit={this.finishEdit.bind(this)}/>
        {pencil ? this.renderPencilButton() : null}
        {error ? this.renderError(error) : null}
      </div>
    );
  }
}

Object.assign(ReactPencil, {
  propTypes: {
    error: PropTypes.string,
    multiline: PropTypes.bool,
    name: PropTypes.string,
    onEditDone: PropTypes.func,
    value: PropTypes.string
  },
  defaultProps: {
    value: '',
    pencil: true,
    onEditDone: () => {}
  }
});

export default ReactPencil;
