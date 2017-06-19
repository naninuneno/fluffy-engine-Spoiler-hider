var STORAGE = (function() {
  
  // new group
  this.addToStorage = function(groupToAdd) {
    // default empty array
    chrome.storage.local.get({groups: []}, function (result) {
      var exists = false;
      result.groups.forEach(function(storedGroup) {
          if (groupToAdd.name == storedGroup.name) {
            exists = true;
            return;
          }
      });
      if (!exists) {
        // set spoilers enabled for new group
        groupToAdd.enabled = true;
        update(result.groups, groupToAdd);
      }
    });

    function update(array, group) {
      array.push(group);
      chrome.storage.local.set({groups: array}, function() {
        console.log('Updated groups (after addition): ' + array);
      });
    }
  }
  
  this.addSpoilerToStorage = function(groupToAddTo, spoilerToAdd) {
    // default empty array
    chrome.storage.local.get({groups: []}, function (result) {
      updateEnabled(result.groups, groupToAddTo, spoilerToAdd);
    });
    
    function updateEnabled(storedGroups, groupToAddTo, spoilerToAdd) {
      updateStorage(storedGroups, groupToAddTo, function(index) {
        // verbosity needed because a direct push isn't enough to update
        // has to be assignment..
        var updatedSpoilers = storedGroups[index].spoilers;
        updatedSpoilers.push(new Spoiler(spoilerToAdd));
        storedGroups[index].spoilers = updatedSpoilers;
      });
    }
  }
  
  // remove group from storage
  this.removeFromStorage = function(groupToRemove) {
    // default empty array
    chrome.storage.local.get({groups: []}, function (result) {
      remove(result.groups, groupToRemove);
    });
    function remove(storedGroups, groupToRemove) {
      updateStorage(storedGroups, groupToRemove, function(index) {
        storedGroups.splice(index, 1);
      });
    }
  }
    
  // update status for group e.g. enabled -> disabled
  this.updateEnabledStatus = function(groupToUpdate) {
    // default empty array
    chrome.storage.local.get({groups: []}, function (result) {
      updateEnabled(result.groups, groupToUpdate);
    });
    function updateEnabled(storedGroups, groupToUpdate) {
      updateStorage(storedGroups, groupToUpdate, function(index) {
        storedGroups[index].enabled = !storedGroups[index].enabled;
      });
    }
  }
    
  // update status for fragment name e.g. enabled -> disabled
  this.updateFragmentNameEnabledStatus = function(groupToUpdate, nameToUpdate) {
    // default empty array
    chrome.storage.local.get({groups: []}, function (result) {
      updateEnabled(result.groups, groupToUpdate);
    });
    
    function updateEnabled(storedGroups, groupToUpdate) {
      updateStorage(storedGroups, groupToUpdate, function(index) {
        updateEnabledForName(storedGroups[index], nameToUpdate);
      });
    }
    
    function updateEnabledForName(groupToUpdate, nameToUpdate) {
      // verbosity needed to update actual target object
      for (i = 0; i < groupToUpdate.spoilers.length; i++) {  
        for (j = 0; j < groupToUpdate.spoilers[i].spoilerFragments.length; j++) {
          if (groupToUpdate.spoilers[i].spoilerFragments[j].text == nameToUpdate) {
            groupToUpdate.spoilers[i].spoilerFragments[j].enabled = !groupToUpdate.spoilers[i].spoilerFragments[j].enabled;
            // don't break as multiple fragments may share name
          }
        }
      }
    }
  }
    
  // generic update storage method for groups, calling fn() on found group
  function updateStorage(storedGroups, groupToUpdate, fn) {
    var index = -1;
    for (i = 0; i < storedGroups.length; i++) {
      var storedGroup = storedGroups[i];
      if (groupToUpdate == storedGroup.name) {
        index = i;
        break;
      }
    }

    if (index > -1) {
      fn(index);
      chrome.storage.local.set({groups: storedGroups}, function() {
        console.log('Updated groups:')
        storedGroups.forEach(function(storedGroup) {
          console.log(storedGroup);
        });
      });
    }
  }
  
  return this;
}());