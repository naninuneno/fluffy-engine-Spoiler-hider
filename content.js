chrome.runtime.sendMessage({method: "storage"}, function(response) {
  console.log("Got response");
  blurSpoilers(response.storage);
});

function blurSpoilers(storage) {
  var spoilerText = "Potential spoilers! Mouse over to view original";
  
  // TODO: make work for other elements
  var texts = document.getElementsByTagName('p');
  var potentialSpoilers = [];
  for (i = 0; i < storage.length; i++) {
    var storedShow = storage[i];
    if (!storedShow.enabled) {
      continue;
    }
    storedShow.cast.forEach(function(character) {
      character.names.forEach(function(name) {
        // remove quotations from character nicknames
        // TODO: move to initial parsing along with name splitting
        if (name.text[0] = "'" && name.text[name.text.length -1] == "'") {
          name.text = name.text.substring(1, name.text.length - 1);
        }
        if (name.enabled) {
          potentialSpoilers.push(name.text);
        }
      });
    });
  }

  // TODO: case-insensitive comparison
  // TODO: poor performance - alternative?
  for (i = 0; i < texts.length; i++) {
    // innerHTML rather than textContent so that links etc. are preserved
    var originalHtml = texts[i].innerHTML;
    var isSpoiler = false;
    
    for (j = 0; j < potentialSpoilers.length; j++) {
      var spoiler = potentialSpoilers[j];
    
      var words = texts[i].textContent.split(" ");
      
      for (k = 0; k < words.length; k++) {
        var word = words[k];
        
        if (word == spoiler) {
          texts[i].textContent = spoilerText;
          
          // closure for immediate execution
          (function (_originalHtml) {
            texts[i].addEventListener("mouseenter", function(e) {
              e.target.innerHTML = _originalHtml;
            });
            
            texts[i].addEventListener("mouseleave", function(e) {
              e.target.textContent = spoilerText;
            });
          })(originalHtml);
          
          isSpoiler = true;
          break;
        }
      }
      
      // already found spoiler candidate - return to continue on
      if (isSpoiler) {
        break;
      }
    }
  }
};