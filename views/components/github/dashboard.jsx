'use strict';

var React = require('react');
var _ = require('lodash');
var io = require('socket.io-client');

var Container = require('./container.jsx');

module.exports = React.createClass({
  getInitialState: function () {
    return {
      pulls: []
    }
  },
  handlePulls: function (pulls) {
    var ids = _.map(this.state.pulls, 'id');

      _.forEach(pulls, function (pull) {
        var index = ids.indexOf(pull.id);

        if (index === -1) {
          this.state.pulls.push(pull);
        } else {
          this.state.pulls[index] = _.assign(this.state.pulls[index], pull);
        }
      }.bind(this));

      this.setState({pulls: _.sortByOrder(this.state.pulls, 'updated_at', [true, false])});
  },
  handlePullsDelete: function (deleted) {
    if (deleted.length) {
      this.setState({pulls: _.filter(this.state.pulls, function (pull) {
        return deleted.indexOf(pull.id) === -1;
      })});
    }
  },
  handlePullsIssues: function (issues) {
    var urls = _.map(this.state.pulls, 'url');

    _.forEach(issues, function (issue) {
      var index = urls.indexOf(issue.pull_request.url);

      if (index !== -1) {
        this.state.pulls[index].labels = issue.labels;
        this.state.pulls[index].comments = issue.comments;
      }
    }.bind(this));

    this.setState({pulls: this.state.pulls});
  },
  handlePullsStatus: function (status) {
    var index = _.map(this.state.pulls, 'id').indexOf(status.pull_request.id);

    if (index !== -1) {
      this.state.pulls[index].last_status = status;
    }

    this.setState({pulls: this.state.pulls});
  },
  componentDidMount: function () {
    var socket = io();

    socket.emit('user', {
      user: this.props.user,
      accessToken: this.props.accessToken
    });

    if (this.props.repositories_url) {
      socket.emit('pulls', this.props.repositories_url);
    }

    socket.on('pulls', this.handlePulls);
    socket.on('pulls:delete', this.handlePullsDelete);
    socket.on('pulls:issues', this.handlePullsIssues);
    socket.on('pulls:status', this.handlePullsStatus);
  },
  render: function () {
    return (
      <section className="dashboard clearfix">
        <Container pulls={this.state.pulls} />
      </section>
    );
  }
});
