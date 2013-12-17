function ActionQueue() {
  this.q = [];
  this.actionIndex = 0;
}

ActionQueue.prototype.push = function(func) {
  this.q.push(func);
};

ActionQueue.prototype.run = function(callbacks) {
  if (this.actionIndex >= this.q.length) {
    callbacks && callbacks.done && callbacks.done.call(this);
    return;
  }
  this.callbacks = callbacks;
  var f = this.q[this.actionIndex];
  this.actionIndex += 1;
  f.call(this);
};

ActionQueue.prototype.finished = function() {
  return this.actionIndex;
};

ActionQueue.prototype.stop = function(err) {
  this.callbacks && this.callbacks.stop && this.callbacks.stop(err);
};

ActionQueue.prototype.goBack = function() {
  this.actionIndex -= 1;
};

ActionQueue.prototype.next = function() {
  if (this.actionIndex >= this.q.length) {
    this.callbacks && this.callbacks.done && this.callbacks.done.call(this);
    return;
  }
  var f = this.q[this.actionIndex];
  this.actionIndex += 1;
  f.call(this);
};

ActionQueue.prototype.total = function() {
  return this.q.length;
};

ActionQueue.prototype.finishedPercentage = function() {
  return (this.finished() / this.total() * 100).toFixed(3) + '%';
};

exports.create = function() {
  return new ActionQueue();
}
