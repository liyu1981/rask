/* actionQueue.js provides a task queue. It is useful when you need to cleanly
   state a tasks in small steps.

   typical useage:

     var aq = rask.actionQueue.create();
     aq.push(function() {
         // step 1 logic
         this.next();
       });
     aq.push(function() {
         // step 2 logic
         if (err) {
           this.stop('err msg');
         }
         // or
         if (warning) {
           var self = this;
           this.goBack();
           setTimeout(function() { self.goBack(); }, 5000);
         }
       });
     aq.start({
       done: function() {},
       stop: function(err) {}
     });
*/

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
  var self = this;
  var f = this.q[this.actionIndex];
  this.actionIndex += 1;
  process.nextTick(function() { f.call(self); });
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
