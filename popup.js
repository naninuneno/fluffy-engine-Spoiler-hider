var commonWords = [
  "the","of","and","a","to","in","is","you","that","it","he","was","for","on","are","as","with","his","they","I","at","be","this","have","from","or","one","had","by","word","but","not","what","all","were","we","when","your","can","said","there","use","an","each","which","she","do","how","their","if","will","up","other","about","out","many","then","them","these","so","some","her","would","make","like","him","into","has","look","get","did","its","been","it's"
];

document.addEventListener('DOMContentLoaded', function() {
 
  var form = document.getElementById('tv-show-search');
  var saveBtn = document.getElementById('save-show');
  var manageBtn = document.getElementById('manage');
  var manageContainer = document.getElementById('manage-container');
  var manageOpen = false;
  var show = {};
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    hideManage();
    
    var tvShow = document['tv-show-search']['tv-show'].value;
    var searchUrl = "http://api.tvmaze.com/singlesearch/shows?q=" + encodeURIComponent(tvShow) + "&embed=cast";
    
    var x = new XMLHttpRequest();
    x.open('GET', searchUrl);
    
    x.responseType = 'json';
    x.onload = function() {
      // Parse and process the response from Google Image Search.
      var response = x.response;
      if (!response || !response.name) {
        document.getElementById('result').innerHTML = 'Couldn\'t find show';
        show = {};
      } else {
        document.getElementById('show-results').style.display = 'block';
        
        show.name = response.name;
        show.img = response.image.medium;
        show.cast = [];
        response._embedded.cast.forEach(function(responseCastMember) {
          var castMember = {};
          castMember.fullName = responseCastMember.character.name;
          castMember.names = [];
          responseCastMember.character.name.split(' ').forEach(function(name) {
            var castMemberName = {};
            castMemberName.text = name;
            castMemberName.enabled = true;
            if (commonWords.indexOf(name) != -1) {
              castMemberName.enabled = false;
              castMemberName.common = true;
            }
            castMember.names.push(castMemberName);
          });
          show.cast.push(castMember);
        });
        
        document.getElementById('result').innerHTML = show.name;
        document.getElementById('result-img').src = show.img;
        var castStr = "<ul>";
        show.cast.forEach(function(character) {
          castStr += "<li><i>" + character.fullName + "</i></li>";
        });
        castStr += "</ul>";
        document.getElementById('cast').innerHTML = castStr; 
      }
    };
    x.send();
  });
  
  saveBtn.addEventListener('click', function(e) {
    hideManage();

    // empty show check
    if (!(Object.keys(show).length === 0 && show.constructor === Object)) {
      updateStorage(show);
    }
    
    function updateStorage(showToAdd) {
      // default empty array
      chrome.storage.sync.get({shows: []}, function (result) {
        var exists = false;
        result.shows.forEach(function(storedShow) {
            if (showToAdd.name == storedShow.name) {
              exists = true;
              return;
            }
        });
        if (!exists) {
          // set spoilers enabled for new show
          showToAdd.enabled = true;
          update(result.shows, showToAdd);
        }
      });

      function update(array, show) {
        array.push(show);
        chrome.storage.sync.set({shows: array}, function() {
          console.log('Updated shows (after addition): ' + array);
        });
      };
    };
  });
  
  manageBtn.addEventListener('click', function(e) {
    if (manageOpen) {
      hideManage();
    } else {
      displayManage();
    }
  });
  
  function hideManage() {
    manageOpen = false;
    
    // hide container
    manageContainer.style.display = 'none';
    // delete all children
    while (manageContainer.hasChildNodes()) {
      manageContainer.removeChild(manageContainer.lastChild);
    }
  }
  
  function displayManage() {
    manageOpen = true;
    
    // display container
    manageContainer.style.display = 'block';

    // display shows
    chrome.storage.sync.get({shows: []}, function (result) {
      result.shows.forEach(function(storedShow) {

        // Whole show view
        var showView = document.createElement('div');
        showView.id = storedShow.name + "-container";
        showView.className = "show-view";
        
        if (storedShow.enabled) {
          showView.className += ' enabled-show';
        } else {
          showView.className += ' disabled-show';
        }
        
        (function(_showName) {
          showView.addEventListener('click', function(e) {
            updateEnabledStatus(_showName);
            if (showView.className.indexOf('enabled-show') != -1) {
              showView.className = showView.className.replace('enabled-show', 'disabled-show');
            } else {
              showView.className = showView.className.replace('disabled-show', 'enabled-show');
            }
          });
        })(storedShow.name);
        
        var showSummaryView = document.createElement('div');
        showSummaryView.className = "show-summary";

        // Show text
        var showNameView = document.createElement('div');
        showNameView.className = 'show-view-text';
        var showNameSpan = document.createElement('span');
        showNameSpan.className = 'show-view-text-span';
        showNameSpan.appendChild(document.createTextNode(storedShow.name));
        showNameView.appendChild(showNameSpan);
        
        // Buttons
        var buttonsView = document.createElement('div');
        buttonsView.className = 'show-view-buttons';
        
        // Expand info functionality
        var expanded = false;
        var expandIcon = document.createElement('i');
        expandIcon.className = 'fa fa-plus expand-show-icon';
        expandIcon.id = 'expand-' + storedShow.name;
        
        _show = storedShow;
        (function(_show) {
          expandIcon.addEventListener('click', function(e) {
            e.stopPropagation();

            var sectionId = 'expanded-' + _show.name;
            if (expanded) {
              showView.removeChild(document.getElementById(sectionId));
            } else {
              var showNameToExpand = e.target.id.replace('expand-', '');
              var expandSection = document.createElement('div');
              expandSection.id = sectionId;
              expandSection.className = 'show-expanded';
              
              _show.cast.forEach(function(character) {
                var namesForCharacter = document.createElement('div');
                namesForCharacter.className = 'character-names';
                
                character.names.forEach(function(name) {
                  var nameText = document.createElement('span');
                  nameText.appendChild(document.createTextNode(name.text));
                  nameText.className = 'name-spoiler';
                  if (name.enabled) {
                    nameText.className += ' name-spoiler-enabled';
                  } else {
                    nameText.className += ' name-spoiler-disabled';
                  }
                  if (name.common) {
                    nameText.className += ' name-common';
                  }
                  nameText.className += ' character-name-' + name.text;
                  
                  if (!name.common) {
                    (function(_showName, _characterName) {
                      nameText.addEventListener('click', function(e) {
                        e.stopPropagation();

                        updateCharacterNameEnabledStatus(_showName, _characterName);

                        // for updating _show
                        name.enabled = !name.enabled;

                        var matchingNameElements = expandSection.getElementsByClassName('character-name-' + name.text);
                        for (i = 0; i < matchingNameElements.length; i++) {
                          var matchingNameElement = matchingNameElements[i];
                          // name.enabled already updated - update element to reflect state
                          if (name.enabled && !name.common) {
                            matchingNameElement.className = matchingNameElement.className.replace('name-spoiler-disabled', 'name-spoiler-enabled');
                          } else {
                            matchingNameElement.className = matchingNameElement.className.replace('name-spoiler-enabled', 'name-spoiler-disabled');
                          }
                        }
                      });
                    })(_show.name, name.text);
                  }
                  
                  namesForCharacter.appendChild(nameText);
                });
                
                var lineBreak = document.createElement('br');
                expandSection.appendChild(namesForCharacter);
                expandSection.appendChild(lineBreak);
              });
              
              showView.appendChild(expandSection);
            }
            
            expanded = !expanded;
          });
        })(storedShow);
        
        // Delete functionality
        var deleteIcon = document.createElement('i');
        deleteIcon.className = 'fa fa-close delete-show-icon';
        deleteIcon.id = 'delete-' + storedShow.name;
        deleteIcon.addEventListener('click', function(e) {
          e.stopPropagation();
          
          var showNameToDelete = e.target.id.replace('delete-', '');
          removeFromStorage(showNameToDelete);
          // and update view to reflect this
          var showViewToRemove = document.getElementById(showNameToDelete + "-container");
          manageContainer.removeChild(showViewToRemove);
        });
        
        buttonsView.appendChild(expandIcon);
        buttonsView.appendChild(deleteIcon);

        // building view for a whole show
        showSummaryView.appendChild(showNameView);
        showSummaryView.appendChild(buttonsView);
        showView.appendChild(showSummaryView);
        manageContainer.appendChild(showView);
      });  
    });
    
    // remove show from storage
    function removeFromStorage(showToRemove) {
      // default empty array
      chrome.storage.sync.get({shows: []}, function (result) {
        remove(result.shows, showToRemove);
      });
      function remove(storedShows, showToRemove) {
        updateStorage(storedShows, showToRemove, function(index) {
          storedShows.splice(index, 1);
        });
      };
    };
    
    // update status for show e.g. enabled -> disabled
    function updateEnabledStatus(showToUpdate) {
      // default empty array
      chrome.storage.sync.get({shows: []}, function (result) {
        updateEnabled(result.shows, showToUpdate);
      });
      function updateEnabled(storedShows, showToUpdate) {
        updateStorage(storedShows, showToUpdate, function(index) {
          storedShows[index].enabled = !storedShows[index].enabled;
        });
      };
    };
    
    // update status for character name e.g. enabled -> disabled
    function updateCharacterNameEnabledStatus(showToUpdate, nameToUpdate) {
      // default empty array
      chrome.storage.sync.get({shows: []}, function (result) {
        updateEnabled(result.shows, showToUpdate);
      });
      function updateEnabled(storedShows, showToUpdate) {
        updateStorage(storedShows, showToUpdate, function(index) {
          updateEnabledForName(storedShows[index], nameToUpdate);
        });
      };
    }
    
    function updateEnabledForName(showToUpdate, nameToUpdate) {
      // verbosity needed to update actual target object
      for (i = 0; i < showToUpdate.cast.length; i++) {  
        for (j = 0; j < showToUpdate.cast[i].names.length; j++) {
          if (showToUpdate.cast[i].names[j].text == nameToUpdate) {
            showToUpdate.cast[i].names[j].enabled = !showToUpdate.cast[i].names[j].enabled;
            // don't break as multiple characters may share name
          }
        }
      }
    }
    
    // generic update storage method for shows, calling fn() on found show
    function updateStorage(storedShows, showToUpdate, fn) {
      var index = -1;
      for (i = 0; i < storedShows.length; i++) {
        var storedShow = storedShows[i];
        if (showToUpdate == storedShow.name) {
          index = i;
          break;
        }
      };

      if (index > -1) {
        fn(index);
        chrome.storage.sync.set({shows: storedShows}, function() {
          console.log('Updated shows:')
          storedShows.forEach(function(storedShow) {
            console.log(storedShow);
          });
        });
      }
    };
  }
});
