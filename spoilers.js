var commonWords = [
  "the","of","and","a","to","in","is","you","that","it","he","was","for","on","are","as","with","his","they","I","at","be","this","have","from","or","one","had","by","word","but","not","what","all","were","we","when","your","can","said","there","use","an","each","which","she","do","how","their","if","will","up","other","about","out","many","then","them","these","so","some","her","would","make","like","him","into","has","look","get","did","its","been","it's","/"
];

var SpoilerGroup = function(name) {
  this.name = name;
  this.spoilers = [];
  
  SpoilerGroup.prototype.setImg = function(img) {
    this.img = img;
  }
  
  SpoilerGroup.prototype.addSpoiler = function(spoiler) {
    this.spoilers.push(spoiler);
  }
}

var Spoiler = function(text) {
  this.fullText = text;
  var spoilerFragments = [];
  
  this.fullText.split(' ').forEach(function(textFragment) {
    var spoilerFragment = {};
    // strip quotations from start/end
    var firstChar = textFragment[0];
    var lastChar = textFragment[textFragment.length -1];
    if (firstChar == "'" || firstChar == '"') {
      textFragment = textFragment.substring(1);
    }
    if (lastChar == "'" || lastChar == '"') {
      textFragment = textFragment.substring(0, textFragment.length - 1);
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