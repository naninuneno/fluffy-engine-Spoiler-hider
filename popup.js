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
    
    // CHROME
    var x = new XMLHttpRequest();
    x.open('GET', searchUrl);
    // The Google image search API responds with JSON, so let Chrome parse it.
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
        response._embedded.cast.forEach(function(castMember) {
          show.cast.push(castMember.character.name);
        });
        
        document.getElementById('result').innerHTML = show.name;
        document.getElementById('result-img').src = show.img;
        var castStr = "<ul>";
        show.cast.forEach(function(character) {
          castStr += "<li><i>" + character + "</i></li>";
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

    // common checkbox class
    var checkboxClass = "show-selection";

    // setup delete show functionality
    var deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = 'Delete';
    manageContainer.appendChild(deleteBtn);
    deleteBtn.addEventListener('click', function(e) {
      var showsToDelete = [];
      var showCheckboxes = manageContainer.getElementsByClassName(checkboxClass);

      for (i = 0; i < showCheckboxes.length; i++) {
          var showCheckbox = showCheckboxes[i];
          if (showCheckbox.checked) {
            var showToRemove = {};
            showToRemove.name = showCheckbox.id;
            showToRemove.view = document.getElementById(showCheckbox.id + "-container");

            showsToDelete.push(showToRemove);
          }
      }

      showsToDelete.forEach(function(showToDelete) {
        // actually remove show from storage
        removeFromStorage(showToDelete.name);
        // and update view to reflect this
        manageContainer.removeChild(showToDelete.view);
      });
    });
    
    function removeFromStorage(showToRemove) {
      // default empty array
      chrome.storage.sync.get({shows: []}, function (result) {
        remove(result.shows, showToRemove);
      });

      function remove(array, showName) {
        var index = -1;
        for (i = 0; i < array.length; i++) {
          var storedShow = array[i];
          if (showName == storedShow.name) {
            index = i;
            break;
          }
        };
        
        // should never be the case but safety
        if (index > -1) {
          array.splice(index, 1);
          chrome.storage.sync.set({shows: array}, function() {
            console.log('Updated shows (after removal): ' + array);
          });
        }
      };
    };

    // display shows
    chrome.storage.sync.get({shows: []}, function (result) {
      result.shows.forEach(function(storedShow) {

        var showView = document.createElement('div');
        showView.id = storedShow.name + "-container";

        var checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.name = storedShow.name;
        checkbox.id = storedShow.name;
        checkbox.className = checkboxClass;

        var label = document.createElement('label')
        label.htmlFor = storedShow.name;
        label.appendChild(document.createTextNode(storedShow.name));

        showView.appendChild(checkbox);
        showView.appendChild(label);
        manageContainer.appendChild(showView);
      });

      manageContainer.appendChild(deleteBtn);
    });
  }
});
