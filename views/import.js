'use strict';

const View = require('./view');

const Jot = require('../models/jot');
const Group = require('../models/group');

const PubSub = require('../utility/pubsub');

const router = require('../routers/path');

class ViewImport extends View {

  initEvents() {
    super.initEvents();

    this.initImportForm();
  }

  initImportForm() {
    const form = this._el.querySelector('.form-import');

    if (form) {
      form.addEventListener('submit', event => {
        event.preventDefault();

        Group.importFromLocal().then(groups => {
          const groupPromises = [];

          groups.forEach(group => {
            groupPromises.push((newGroups) => {
              return Group.insert({
                fields: group.fields,
                dateAdded: group._dateAdded
              }).then(newGroup => {
                newGroups.push(newGroup);
                return newGroups;
              });
            });
          });

          let groupPromiseChain = Promise.resolve([]);
          groupPromises.forEach(groupPromise => {
            groupPromiseChain = groupPromiseChain.then(groupPromise);
          });

          return groupPromiseChain.then(newGroups => {
            const jotPromises = [];

            groups.forEach((group, index) => {
              group.jots.forEach(jot => {
                const newFields = jot.fields;
                newFields.group = newGroups[index].id;
                jotPromises.push(() => {
                  return Jot.insert({
                    fields: newFields,
                    dateAdded: jot._dateAdded
                  });
                });
              });
            });

            let jotPromiseChain = Promise.resolve();
            jotPromises.forEach(jotPromise => {
              jotPromiseChain = jotPromiseChain.then(jotPromise);
            });

            return jotPromiseChain;
          });
        })
        .then(() => {
          return Group.removeFromLocal();
        })
        .then(() => {
          PubSub.publish('notify', {
            title: 'Jots imported'
          });
          router.go('/group');
          return true;
        });
      });
    }
  }
}

module.exports = ViewImport;
