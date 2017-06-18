var commonWords = [
  "the","of","and","a","to","in","is","you","that","it","he","was","for","on","are","as","with","his","they","I","at","be","this","have","from","or","one","had","by","word","but","not","what","all","were","we","when","your","can","said","there","use","an","each","which","she","do","how","their","if","will","up","other","about","out","many","then","them","these","so","some","her","would","make","like","him","into","has","look","get","did","its","been","it's","/"
];

function SpoilerGroup(name) {
  this.name = name;
  this.spoilers = [];
  
  SpoilerGroup.prototype.setImg = function(img) {
    this.img = img;
  }
  
  SpoilerGroup.prototype.addSpoiler = function(spoiler) {
    this.spoilers.push(spoiler);
  }
}

function Spoiler(text) {
  this.fullText = text;
  var spoilerFragments = [];
  
  this.fullText.split(' ').forEach(function(textFragment) {
    var spoilerFragment = {};
    // strip quotations from start/end
    var firstChar = textFragment[0];
    var lastChar = textFragment[textFragment.length -1];
    if ((firstChar = "'" && lastChar == "'") || (firstChar = '"' && lastChar == '"')) {
      textFragment = textFragment.substring(1, textFragment.length - 1);
    }
    spoilerFragment.text = textFragment;
    spoilerFragment.enabled = true;
    
    if (commonWords.indexOf(textFragment.toLowerCase()) != -1) {
      spoilerFragment.enabled = false;
      spoilerFragment.common = true;
    }
    spoilerFragments.push(spoilerFragment);
  });
  
  this.spoilerFragments = spoilerFragments;
}

document.addEventListener('DOMContentLoaded', function() {
 
  var form = document.getElementById('tv-group-search');
  var saveBtn = document.getElementById('save-group');
  var manageBtn = document.getElementById('manage');
  var manageContainer = document.getElementById('manage-container');
  var addBtn = document.getElementById('add');
  var newGroupContainer = document.getElementById('new-group-container');
  var manageGroupContainer = document.getElementById('manage-group-container');
  var groupCreationInProgress = false;
  var manageOpen = false;
  var spoilerGroup = {};
  
  // searching for show
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    hideManage();
    
    var tvGroup = document['tv-group-search']['tv-group'].value;
    var searchUrl = "http://api.tvmaze.com/singlesearch/shows?q=" + encodeURIComponent(tvGroup) + "&embed=cast";
    
    var x = new XMLHttpRequest();
    x.open('GET', searchUrl);
    
    x.responseType = 'json';
    x.onload = function() {
      // Parse and process the response from Google Image Search.
      var response = x.response;
      if (!response || !response.name) {
        document.getElementById('result').innerHTML = 'Couldn\'t find group';
        spoilerGroup = {};
      } else {
        document.getElementById('group-results').style.display = 'block';
        
        spoilerGroup = new SpoilerGroup(response.name);
        spoilerGroup.setImg(response.image.medium);
        response._embedded.cast.forEach(function(responseCastMember) {
          spoilerGroup.addSpoiler(
            new Spoiler(responseCastMember.character.name)
          );
        });
        
        document.getElementById('result').innerHTML = spoilerGroup.name;
        document.getElementById('result-img').src = spoilerGroup.img;
        var spoilerStr = "<ul>";
        spoilerGroup.spoilers.forEach(function(spoiler) {
          spoilerStr += "<li><i>" + spoiler.fullText + "</i></li>";
        });
        spoilerStr += "</ul>";
        document.getElementById('spoiler').innerHTML = spoilerStr;
      }
    };
    x.send();
  });
  
  function saveNewGroup(spoilerGroup) {
    hideManage();

    // empty group check
    if (!(Object.keys(spoilerGroup).length === 0 && spoilerGroup.constructor === Object)) {
      addToStorage(spoilerGroup);
    }
  }
  
  saveBtn.addEventListener('click', function(e) {
    saveNewGroup(spoilerGroup);
  });
  
  manageBtn.addEventListener('click', function(e) {
    if (manageOpen) {
      hideManage();
    } else {
      displayManage();
    }
  });
  
  addBtn.addEventListener('click', function(e) {
    if (!groupCreationInProgress) {
      groupCreationInProgress = true;
      
      var newSpoilerGroup = createNewSpoilerGroupView();
      newGroupContainer.appendChild(newSpoilerGroup);
      // focus on new input field to enter name
      document.getElementById('spoiler-group-name-new').focus();
    }
  });
  
  function hideManage() {
    manageOpen = false;
    
    // hide container
    manageContainer.style.display = 'none';
    // delete all children
    while (manageGroupContainer.hasChildNodes()) {
      manageGroupContainer.removeChild(manageGroupContainer.lastChild);
    }
  }
  
  function displayManage() {
    manageOpen = true;
    
    // display container
    manageContainer.style.display = 'block';

    // display groups
    chrome.storage.local.get({groups: []}, function (result) {
      result.groups.forEach(function(storedGroup) {

        // Whole group view
        var groupView = createGroupView(storedGroup);
        
        var groupSummaryView = document.createElement('div');
        groupSummaryView.className = "group-summary";

        // Group text
        var groupNameView = document.createElement('div');
        groupNameView.className = 'group-view-text';
        var groupNameSpan = document.createElement('span');
        groupNameSpan.className = 'group-view-text-span';
        groupNameSpan.appendChild(document.createTextNode(storedGroup.name));
        groupNameView.appendChild(groupNameSpan);
        
        // Buttons
        var buttonsView = document.createElement('div');
        buttonsView.className = 'group-view-buttons';
        
        // Expand info functionality
        var expandIcon = createExpandIcon(storedGroup, groupView);
        
        // Delete functionality
        var deleteIcon = createDeleteIcon(storedGroup);
        
        buttonsView.appendChild(expandIcon);
        buttonsView.appendChild(deleteIcon);

        // building view for a whole group
        groupSummaryView.appendChild(groupNameView);
        groupSummaryView.appendChild(buttonsView);
        groupView.appendChild(groupSummaryView);
        manageGroupContainer.appendChild(groupView);
      });  
    });
  }
  
  function createNewSpoilerGroupView() {
    var groupElement = document.createElement('div');
    // TODO: id - should include name
    groupElement.className = "group-view";
    groupElement.className += ' enabled-group';
    
    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.id = "spoiler-group-name-new";
    
    var newGroupNameEl = document.createElement('div');
    newGroupNameEl.id = 'new-group-el';
    newGroupNameEl.appendChild(nameInput);
    
    var finishBtn = document.createElement('i');
    finishBtn.className = 'fa fa-check';
    finishBtn.id = 'spoiler-group-finish';
    
    // TODO: don't close if already exists - some visual validation
    finishBtn.addEventListener('click', function(e) {
      var newGroupName = nameInput.value;
      if (!newGroupName) {
        return;
      }
      
      var newSpoilerGroup = new SpoilerGroup(nameInput.value);
      saveNewGroup(newSpoilerGroup);
      
      newGroupContainer.removeChild(groupElement);
      groupCreationInProgress = false;
    });
    
    var newGroupFinishEl = document.createElement('div');
    newGroupFinishEl.id = 'new-group-finish-el';
    newGroupFinishEl.appendChild(finishBtn);
    
    groupElement.appendChild(newGroupNameEl);
    groupElement.appendChild(newGroupFinishEl);
    
    return groupElement;
  }
  
  function createGroupView(storedGroup) {
    var groupView = document.createElement('div');
    groupView.id = storedGroup.name + "-container";
    groupView.className = "group-view";

    if (storedGroup.enabled) {
      groupView.className += ' enabled-group';
    } else {
      groupView.className += ' disabled-group';
    }
    
    (function(_groupName) {
      groupView.addEventListener('click', function(e) {
        updateEnabledStatus(_groupName);
        if (groupView.className.indexOf('enabled-group') != -1) {
          groupView.className = groupView.className.replace('enabled-group', 'disabled-group');
        } else {
          groupView.className = groupView.className.replace('disabled-group', 'enabled-group');
        }
      });
    })(storedGroup.name);
    
    return groupView;
  };
  
  function createExpandIcon(storedGroup, groupView) {
    var expandIcon = document.createElement('i');
    expandIcon.className = 'fa fa-caret-down expand-group-icon';
    expandIcon.id = 'expand-' + storedGroup.name;
    
    var expanded = false;
    var newSpoilerInCreation = false;

    (function(_group) {
      expandIcon.addEventListener('click', function(e) {
        e.stopPropagation();

        var sectionId = 'expanded-' + _group.name;
        if (expanded) {
          // change icon to show it's closed now
          expandIcon.className = expandIcon.className.replace('fa-caret-up', 'fa-caret-down');
          
          groupView.removeChild(document.getElementById(sectionId));
        } else {
          // change icon to show it's expanded now
          expandIcon.className = expandIcon.className.replace('fa-caret-down', 'fa-caret-up');
          
          var groupNameToExpand = e.target.id.replace('expand-', '');
          var expandSection = document.createElement('div');
          expandSection.id = sectionId;
          expandSection.className = 'group-expanded';
          
          // adding new spoiler
          var newSpoilerIcon = document.createElement('i');
          newSpoilerIcon.className = 'fa fa-plus new-spoiler';
          newSpoilerIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            
            if (newSpoilerInCreation) {
              return;
            }
            
            newSpoilerInCreation = true;
            
            var spoilerNameInput = document.createElement("input");
            spoilerNameInput.type = "text";
            spoilerNameInput.className = 'new-spoiler-input';
            spoilerNameInput.addEventListener('click', function(e) {
              e.stopPropagation();
            });
            
            var spoilerFinishIcon = document.createElement('i');
            spoilerFinishIcon.className = 'fa fa-check new-spoiler-finish';
            
            var firstStoredSpoiler = document.getElementsByClassName('fragment-names')[0];
            
            if (firstStoredSpoiler) {
              expandSection.insertBefore(spoilerNameInput, firstStoredSpoiler);
              expandSection.insertBefore(spoilerFinishIcon, firstStoredSpoiler);
            } else {
              expandSection.appendChild(spoilerNameInput);
              expandSection.appendChild(spoilerFinishIcon);
            }
            
            // focus on new input field to enter name
            spoilerNameInput.focus();
            
            spoilerFinishIcon.addEventListener('click', function(e) {
              e.stopPropagation();
              
              // for storage
              addSpoilerToStorage(_group.name, spoilerNameInput.value);
              // for UI update
              _group.spoilers.push(new Spoiler(spoilerNameInput.value));
              
              expandSection.removeChild(spoilerNameInput);
              expandSection.removeChild(spoilerFinishIcon);
              newSpoilerInCreation = false;
            })
          });
          
          expandSection.appendChild(newSpoilerIcon);
          expandSection.appendChild(document.createElement('br'));
          expandSection.appendChild(document.createElement('br'));

          // add elements for existing stored spoilers
          _group.spoilers.forEach(function(spoiler) {
            var spoilerFragments = createSpoilerFragmentsElement(expandSection, _group, spoiler);

            expandSection.appendChild(spoilerFragments);
            expandSection.appendChild(document.createElement('br'));
          });

          groupView.appendChild(expandSection);
        }

        expanded = !expanded;
      });
    })(storedGroup);
    
    return expandIcon;
  };
  
  function createSpoilerFragmentsElement(parentElement, group, spoiler) {
    var spoilerFragments = document.createElement('div');
    spoilerFragments.className = 'fragment-names';

    spoiler.spoilerFragments.forEach(function(fragment) {
      var fragmentText = document.createElement('span');
      fragmentText.appendChild(document.createTextNode(fragment.text));
      fragmentText.className = 'fragment-spoiler';
      if (fragment.enabled) {
        fragmentText.className += ' fragment-spoiler-enabled';
      } else {
        fragmentText.className += ' fragment-spoiler-disabled';
      }
      if (fragment.common) {
        fragmentText.className += ' fragment-common';
      }
      fragmentText.className += ' fragment-name-' + fragment.text;

      if (!fragment.common) {
        (function(_groupName, _fragmentName) {
          fragmentText.addEventListener('click', function(e) {
            e.stopPropagation();

            updateFragmentNameEnabledStatus(_groupName, _fragmentName);

            // for updating _group
            fragment.enabled = !fragment.enabled;

            var matchingNameElements = parentElement.getElementsByClassName('fragment-name-' + _fragmentName);
            for (i = 0; i < matchingNameElements.length; i++) {
              var matchingNameElement = matchingNameElements[i];
              // name.enabled already updated - update element to reflect state
              if (fragment.enabled && !fragment.common) {
                matchingNameElement.className = matchingNameElement.className.replace('fragment-spoiler-disabled', 'fragment-spoiler-enabled');
              } else {
                matchingNameElement.className = matchingNameElement.className.replace('fragment-spoiler-enabled', 'fragment-spoiler-disabled');
              }
            }
          });
        })(group.name, fragment.text);
      }

      spoilerFragments.appendChild(fragmentText);
    });
    
    return spoilerFragments;
  }
  
  function createDeleteIcon(storedGroup) {
    var deleteIcon = document.createElement('i');
    deleteIcon.className = 'fa fa-close delete-group-icon';
    deleteIcon.id = 'delete-' + storedGroup.name;
    deleteIcon.addEventListener('click', function(e) {
      e.stopPropagation();

      var groupNameToDelete = e.target.id.replace('delete-', '');
      removeFromStorage(groupNameToDelete);
      // and update view to reflect this
      var groupViewToRemove = document.getElementById(groupNameToDelete + "-container");
      manageGroupContainer.removeChild(groupViewToRemove);
    });
    
    return deleteIcon;
  };
  
  // new group
  function addToStorage(groupToAdd) {
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
    };
  };
  
  function addSpoilerToStorage(groupToAddTo, spoilerToAdd) {
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
    };
  }
  
  // remove group from storage
  function removeFromStorage(groupToRemove) {
    // default empty array
    chrome.storage.local.get({groups: []}, function (result) {
      remove(result.groups, groupToRemove);
    });
    function remove(storedGroups, groupToRemove) {
      updateStorage(storedGroups, groupToRemove, function(index) {
        storedGroups.splice(index, 1);
      });
    };
  };
    
  // update status for group e.g. enabled -> disabled
  function updateEnabledStatus(groupToUpdate) {
    // default empty array
    chrome.storage.local.get({groups: []}, function (result) {
      updateEnabled(result.groups, groupToUpdate);
    });
    function updateEnabled(storedGroups, groupToUpdate) {
      updateStorage(storedGroups, groupToUpdate, function(index) {
        storedGroups[index].enabled = !storedGroups[index].enabled;
      });
    };
  };
    
  // update status for fragment name e.g. enabled -> disabled
  function updateFragmentNameEnabledStatus(groupToUpdate, nameToUpdate) {
    // default empty array
    chrome.storage.local.get({groups: []}, function (result) {
      updateEnabled(result.groups, groupToUpdate);
    });
    
    function updateEnabled(storedGroups, groupToUpdate) {
      updateStorage(storedGroups, groupToUpdate, function(index) {
        updateEnabledForName(storedGroups[index], nameToUpdate);
      });
    };
    
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
    };
  };
    
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
  };
});
