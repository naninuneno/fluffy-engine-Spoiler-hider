document.addEventListener('DOMContentLoaded', function() {
 
  var manageExpand = document.getElementById('manage');
  var manageContainer = document.getElementById('manage-container');
  var addBtn = document.getElementById('add');
  var newGroupContainer = document.getElementById('new-group-container');
  var manageGroupContainer = document.getElementById('manage-group-container');
  
  var groupCreationInProgress = false;
  var newSpoilerInCreation = false;
  var manageOpen = false;
  var tvSearchOpen = false;
  
  var tvSaveSuccessEl = document.getElementById('tv-save-success');
  var tvSaveFailureEl = document.getElementById('tv-save-failure');
  var tvSearchContainer = document.getElementById('tv-search-container');
  var tvSearchForm = document.getElementById('tv-group-search');
  var saveBtn = document.getElementById('save-group');
  var tvSearchExpand = document.getElementById('tv-group-search-expand');
  var tvResultsEl = document.getElementById('tv-results');
  
  manageContainer.classList.add('collapsed');
  tvSearchContainer.classList.add('collapsed');
  
  var spoilerGroup = {};
  
  addBtn.addEventListener('click', function(e) {
    if (!groupCreationInProgress) {
      groupCreationInProgress = true;
      
      var newSpoilerGroup = createNewSpoilerGroupView();
      newGroupContainer.appendChild(newSpoilerGroup);
      // focus on new input field to enter name
      document.getElementById('spoiler-group-name-new').focus();
    }
  });
  
  // TODO: move structure to HTML and hide - can get rid of code and flag for spoilerCreationInProgress
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
    
    
    var finishIcon = document.createElement('i');
    finishIcon.id = 'spoiler-group-finish';
    finishIcon.className = 'fa fa-check';
    
    var deleteIcon = document.createElement('i');
    deleteIcon.className = 'fa fa-close delete-group-icon';
    
    // TODO: don't close if already exists - some visual validation
    finishIcon.addEventListener('click', function(e) {
      var newGroupName = nameInput.value;
      if (!newGroupName) {
        return;
      }
      
      var newSpoilerGroup = new SpoilerGroup(nameInput.value);
      saveNewGroup(newSpoilerGroup);
      
      newGroupContainer.removeChild(groupElement);
      groupCreationInProgress = false;
    });
    
    deleteIcon.addEventListener('click', function(e) {
      newGroupContainer.removeChild(groupElement);
      groupCreationInProgress = false;
    });
    
    var newGroupFinishEl = document.createElement('div');
    newGroupFinishEl.id = 'new-group-finish-el';
    newGroupFinishEl.appendChild(finishIcon);
    newGroupFinishEl.appendChild(deleteIcon);
    
    groupElement.appendChild(newGroupNameEl);
    groupElement.appendChild(newGroupFinishEl);
    
    return groupElement;
  }
  
  manageExpand.addEventListener('click', function(e) {
    if (manageOpen) {
      hideManage();
    } else {
      displayManage();
    }
    manageContainer.classList.toggle('collapsed');
    toggleCaretState('manage-expand-caret-icon');
  });
  
  tvSearchExpand.addEventListener('click', function(e) {
    tvSearchContainer.classList.toggle('collapsed');
    toggleCaretState('tv-expand-caret-icon');
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
    
    // hide container
    manageContainer.style.display = 'block';

    // display groups
    chrome.storage.local.get({groups: []}, function (result) {
      result.groups.forEach(function(storedGroup) {

        createAndAppendSpoilerGroupElementToManage(storedGroup);
      });  
    });
  }
  
  function createAndAppendSpoilerGroupElementToManage(storedGroup) {
    
    if (manageGroupContainer) {
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
    }
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
        STORAGE.updateEnabledStatus(_groupName);
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

    (function(_group) {
      expandIcon.addEventListener('click', function(e) {
        e.stopPropagation();

        var sectionId = 'expanded-' + _group.name;
        if (expanded) {
          closeExpandView(expandIcon, groupView, sectionId);
        } else {
          openExpandView(_group, expandIcon, groupView, sectionId);
        }

        expanded = !expanded;
      });
    })(storedGroup);
    
    return expandIcon;
  }
  
  function closeExpandView(expandIcon, groupView, sectionId) {
    // change icon to show it's closed now
    expandIcon.className = expandIcon.className.replace('fa-caret-up', 'fa-caret-down');

    groupView.removeChild(document.getElementById(sectionId));
  }
  
  function openExpandView(_group, expandIcon, groupView, sectionId) {
    // change icon to show it's expanded now
    expandIcon.className = expandIcon.className.replace('fa-caret-down', 'fa-caret-up');

    var expandSection = document.createElement('div');
    expandSection.id = sectionId;
    expandSection.className = 'group-expanded';

    // adding new spoiler
    var newSpoilerBtn = document.createElement('button');
    newSpoilerBtn.type = 'button';
    newSpoilerBtn.className = 'btn btn-info btn-sm new-spoiler';
    newSpoilerBtn.textContent = 'Add\u2026';
    newSpoilerBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      
      createNewSpoiler(_group, expandSection);
    });

    expandSection.appendChild(newSpoilerBtn);
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
  
  function createNewSpoiler(_group, expandSection) {
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
      STORAGE.addSpoilerToStorage(_group.name, spoilerNameInput.value);
      // for UI update
      _group.spoilers.push(new Spoiler(spoilerNameInput.value));

      expandSection.removeChild(spoilerNameInput);
      expandSection.removeChild(spoilerFinishIcon);
      newSpoilerInCreation = false;
    });
  }
  
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

            STORAGE.updateFragmentNameEnabledStatus(_groupName, _fragmentName);

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
      STORAGE.removeFromStorage(groupNameToDelete);
      // and update view to reflect this
      var groupViewToRemove = document.getElementById(groupNameToDelete + "-container");
      manageGroupContainer.removeChild(groupViewToRemove);
    });
    
    return deleteIcon;
  }
  
  
  //////////////////////////
  // SEARCH FUNCTIONALITY //
  //////////////////////////

  
  // searching for show
  tvSearchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    removeTvCharactersFromCharacterListElement();
    
    tvSaveFailureEl.style.display = 'none';
    
    var tvGroup = document['tv-group-search']['tv-group'].value;
    var searchUrl = "http://api.tvmaze.com/singlesearch/shows?q=" + encodeURIComponent(tvGroup) + "&embed=cast";
    
    sendRequest(searchUrl);
  });
  
  function removeTvCharactersFromCharacterListElement() {
    var characterList = document.getElementById('tv-characters-list');
    while (characterList.hasChildNodes()) {
      characterList.removeChild(characterList.lastChild);
    }
  }
  
  function sendRequest(searchUrl) {
    var request = new XMLHttpRequest();
    request.open('GET', searchUrl);
    
    request.responseType = 'json';
    request.onload = function() {
      // Parse and process the response from Google Image Search.
      var response = request.response;
      var tvSearchFailureEl = document.getElementById('tv-search-failure');
      
      if (!response || !response.name) {
        saveBtn.disabled = true;
        tvSearchFailureEl.style.display = 'block';
        tvResultsEl.style.display = 'none';
        spoilerGroup = {};
        
      } else {
        saveBtn.removeAttribute('disabled');
        tvSearchFailureEl.style.display = 'none';
        tvResultsEl.style.display = 'block';
        
        spoilerGroup = new SpoilerGroup(response.name);
        spoilerGroup.setImg(response.image.medium);
        response._embedded.cast.forEach(function(responseCastMember) {
          spoilerGroup.addSpoiler(
            new Spoiler(responseCastMember.character.name)
          );
        });
        
        document.getElementById('tv-result-name').textContent = spoilerGroup.name;
        document.getElementById('tv-result-img').src = spoilerGroup.img;
        var spoilerListEl = document.getElementById('tv-characters-list');
        spoilerGroup.spoilers.forEach(function(spoiler) {
          var listEl = document.createElement('li');
          var italicsEl = document.createElement('i');
          italicsEl.textContent = spoiler.fullText;
          listEl.appendChild(italicsEl);
          spoilerListEl.appendChild(listEl);
        });
      }
    };
    request.send();
  }
  
  saveBtn.addEventListener('click', function(e) {
    if (saveNewGroup(spoilerGroup)) {
      showGroupSaved();
    } else {
      showFailureToSaveGroup();
    }
    saveBtn.disabled = true;
  });
  
  function saveNewGroup(spoilerGroup) {
    if (!(Object.keys(spoilerGroup).length === 0 &&   spoilerGroup.constructor === Object)) {
      STORAGE.addToStorage(spoilerGroup);
      createAndAppendSpoilerGroupElementToManage(spoilerGroup);
      return true;
    }
    return false;
  }
  
  function showGroupSaved() {
    // hide results that have been saved
    tvResultsEl.style.display = 'none';
    tvSaveFailureEl.style.display = 'none';
    // briefly display success message
    tvSaveSuccessEl.style.display = 'block';
    setTimeout(function() {
      tvSaveSuccessEl.style.display = 'none';
    }, 5000);
  }
  
  function showFailureToSaveGroup() {
    tvSaveFailureEl.style.display = 'block';
    setTimeout(function() {
      tvSaveFailureEl.style.display = 'none';
    }, 5000);
  }
  
  
  /////////////
  // GENERIC //
  /////////////
  
  
  function toggleCaretState(elementId) {
    var caretIcon = document.getElementById(elementId);
    caretIcon.classList.toggle('fa-caret-down');
    caretIcon.classList.toggle('fa-caret-up');
  }
});
