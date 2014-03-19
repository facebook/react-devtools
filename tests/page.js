/**
 * Copyright (c) 2013-2014, Facebook, Inc. All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 *  * Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 * 
 *  * Neither the name Facebook nor the names of its contributors may be used to
 *    endorse or promote products derived from this software without specific
 *    prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

var InnerComponent = React.createClass({

  displayName: 'InnerComponent',

  render: function() {
    var even = React.DOM.p({ key: 'even' }, 'even');
    var odd = React.DOM.p({ key: 'odd' }, 'odd');
    return React.DOM.div({},
      this.props.counter > 5 ? React.DOM.span(null, this.props.counter) : React.DOM.span(),
      this.props.counter % 2 == 1 ? [even, odd] : [odd, even],
      this.props.counter % 10 == 9 ? React.DOM.div() : null,
      React.DOM.span({ onClick: this.props.onSomething.bind(null, 1, 2), regexp: /test/i, date: new Date(), array: [1,2,{},'str'] }, 'THIS HAS A HANDLER')
    );
  }

});

var TestComponent = React.createClass({

  displayName: 'TestComponent',

  getInitialState: function() {
    return { counter: 0 };
  },

  componentDidMount: function() {
    this._timer = setInterval(this.increment, 1000);
  },

  componentWillUnmount: function() {
    clearInterval(this._timer);
  },

  increment: function() {
    this.setState({
      counter: this.state.counter + 1
    });
  },

  handleCallback: function(something) {
    this.setState({
      counter: 0
    });
  },

  render: function() {
    return React.DOM.div({className: 'hello world'},
      this.state.counter,
      InnerComponent({ counter: this.state.counter, onSomething: this.handleCallback }),
      this.state.counter < 10 ? this.props.children : null
    );
  }

});

var List = React.createClass({

  displayName: 'List',

  render: function() {
    return React.DOM.ul(null,
      this.props.items.map(function(item) {
        return React.DOM.li(null, item)
      })
    );
  }

});

var OuterComponent = React.createClass({

  displayName: 'OuterComponent',

  render: function() {
    return React.DOM.div({},
      React.DOM.a(
        { href: 'http://facebook.com' }, 
        React.DOM.img({ src: '/icons/icon128.png' })
      ),
      React.DOM.div({}, React.DOM.span({}, List({items:['a', 'b', 'c']}))),
      TestComponent(
        { regexp3: /test/i },
        React.DOM.p({}, 'document', React.DOM.span())
      )
    );
  }

});

var container = document.createElement('div');
React.renderComponent(OuterComponent({ instance: 1 }), container);
document.body.appendChild(container);

var container2 = document.createElement('div');
document.body.appendChild(container2);

setTimeout(function() {
  // Render a second component later
  React.renderComponent(OuterComponent({ instance: 2 }), container2);
  setTimeout(function() {
    React.unmountComponentAtNode(container2);
  }, 5000);
}, 5000);
