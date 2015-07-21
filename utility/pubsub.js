class PubSub {
  //based on pubsub implementation at http://addyosmani.com/resources/essentialjsdesignpatterns/book/#observerpatternjavascript

  constructor() {
    // Storage for topics that can be broadcast
    // or listened to
    this._topics = {};

    // An topic identifier
    this._subUid = -1;
  }

  // Publish or broadcast events of interest
  // with a specific topic name and arguments
  // such as the data to pass along
  publish(topic, args) {
    if (!this._topics[topic]) {
      return false;
    }

    var subscribers = this._topics[topic];
    var len = subscribers ? subscribers.length : 0;

    while (len--) {
      subscribers[len].func(topic, args);
    }

    return this;
  }

  // Subscribe to events of interest
  // with a specific topic name and a
  // callback function, to be executed
  // when the topic/event is observed
  subscribe(topic, func) {
    if (!this._topics[topic]) {
      this._topics[topic] = [];
    }

    var token = (++this._subUid).toString();
    this._topics[topic].push({
      token: token,
      func: func
    });

    return token;
  }

  // Unsubscribe from a specific
  // topic, based on a tokenized reference
  // to the subscription
  unsubscribe(token) {
    for (var m in this._topics) {
      if (this._topics[m]) {
        for (var i = 0, j = this._topics[m].length; i < j; i++) {
          if (this._topics[m][i].token === token) {
            this._topics[m].splice(i, 1);
            return token;
          }
        }
      }
    }

    return this;
  }
}

module.exports = new PubSub();
