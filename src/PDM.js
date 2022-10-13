export const parseSong = function(song){
    let tempSong = song.item.name + " -";
    song.item.artists.forEach(function(element, i){ //add commas for songs with multiple artists
        tempSong +=  " " + element.name;
        if(i !== (song.item.artists).length - 1){ tempSong += ","; } //stop adding commas if we are one before the end
    })
    return tempSong;
}
