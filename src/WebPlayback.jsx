import React, { useState, useEffect } from 'react'
import axios from 'axios'

const track = {
  name: '',
  album: {
    images: [
      { url: '' }
    ]
  },
  artists: [
    { name: '' }
  ]
}

function WebPlayback (props) {
  const [is_paused, setPaused] = useState(false)
  const [is_active, setActive] = useState(false)
  const [player, setPlayer] = useState(undefined)
  const [current_track, setTrack] = useState(track)

  axios.defaults.headers.common['Authorization'] = 'Bearer ' + props.token;

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true

    var sessionLength = 0
    var prevPos = 9999999999
    var artists = {}
    var tracks = []
    var genres = {}

    document.body.appendChild(script)

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Web Playback SDK',
        getOAuthToken: cb => { cb(props.token) },
        volume: 0.5
      })

      function pickHighest (obj, num = 1) {
        const requiredObj = {}
        if (num > Object.keys(obj).length) {
          return false
        };
        Object.keys(obj).sort((a, b) => obj[b] - obj[a]).forEach((key, ind) => {
          if (ind < num) {
            requiredObj[key] = obj[key]
          }
        })
        return Object.keys(requiredObj)
      }

      setPlayer(player)

      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id)
      })

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id)
      })

      player.addListener('player_state_changed', state => {
        if (!state) {
          return
        }

        setTrack(state.track_window.current_track)
        setPaused(state.paused)

        player.getCurrentState().then(state => {
          (!state) ? setActive(false) : setActive(true)
        })

        if (prevPos > state.position) {
          // getting seed data
          tracks.unshift(state.track_window.current_track.id)
          if (tracks.length > 5) {
            tracks = tracks.slice(0, 5)
          }
          for (var i = 0; i < state.track_window.current_track.artists.length; i++) {
            var uri = state.track_window.current_track.artists[i].uri.substring(15)
            if (uri in artists) {
              artists[uri] = artists[uri] + 1
            } else {
              artists[uri] = 1
            }
            axios.get('https://api.spotify.com/v1/artists/' + uri)
              .then(function (response) {
                let responseJSON = JSON.parse(response.request.response)
                for (let j = 0; j < responseJSON.genres.length; j++) {
                  if (responseJSON.genres[j] in genres) {
                    genres[responseJSON.genres[j]] = genres[responseJSON.genres[j]] + 1
                  } else {
                    genres[responseJSON.genres[j]] = 1
                  }
                }
              })
              .catch(function (error) {
                console.error(error)
              })
          }
          // getting session data
          axios.get('https://api.spotify.com/v1/audio-features/' + state.track_window.current_track.id)
            .then(function (response) {
              let responseJSON = JSON.parse(response.request.response)
              document.getElementById('danceabilityAvg').innerHTML = +(((Number(document.getElementById('danceabilityAvg').innerHTML) * sessionLength) + responseJSON.danceability) / (sessionLength + 1)).toFixed(3)
              document.getElementById('danceability').innerHTML = responseJSON.danceability
              document.getElementById('energyAvg').innerHTML = +(((Number(document.getElementById('energyAvg').innerHTML) * sessionLength) + responseJSON.energy) / (sessionLength + 1)).toFixed(3)
              document.getElementById('energy').innerHTML = responseJSON.energy
              document.getElementById('acousticnessAvg').innerHTML = +(((Number(document.getElementById('acousticnessAvg').innerHTML) * sessionLength) + responseJSON.acousticness) / (sessionLength + 1)).toFixed(3)
              document.getElementById('acousticness').innerHTML = responseJSON.acousticness
              document.getElementById('instrumentalnessAvg').innerHTML = +(((Number(document.getElementById('instrumentalnessAvg').innerHTML) * sessionLength) + responseJSON.instrumentalness) / (sessionLength + 1)).toFixed(3)
              document.getElementById('instrumentalness').innerHTML = responseJSON.instrumentalness
              document.getElementById('speechinessAvg').innerHTML = +(((Number(document.getElementById('speechinessAvg').innerHTML) * sessionLength) + responseJSON.speechiness) / (sessionLength + 1)).toFixed(3)
              document.getElementById('speechiness').innerHTML = responseJSON.speechiness
              document.getElementById('livenessAvg').innerHTML = +(((Number(document.getElementById('livenessAvg').innerHTML) * sessionLength) + responseJSON.liveness) / (sessionLength + 1)).toFixed(3)
              document.getElementById('liveness').innerHTML = responseJSON.liveness
              document.getElementById('valenceAvg').innerHTML = +(((Number(document.getElementById('valenceAvg').innerHTML) * sessionLength) + responseJSON.valence) / (sessionLength + 1)).toFixed(3)
              document.getElementById('valence').innerHTML = responseJSON.valence
              document.getElementById('tempoAvg').innerHTML = +(((Number(document.getElementById('tempoAvg').innerHTML) * sessionLength) + responseJSON.tempo) / (sessionLength + 1)).toFixed(3)
              document.getElementById('tempo').innerHTML = responseJSON.tempo
              document.getElementById('loudnessAvg').innerHTML = +(((Number(document.getElementById('loudnessAvg').innerHTML) * sessionLength) + responseJSON.loudness) / (sessionLength + 1)).toFixed(3)
              document.getElementById('loudness').innerHTML = responseJSON.loudness
              document.getElementById('modeAvg').innerHTML = +(((Number(document.getElementById('modeAvg').innerHTML) * sessionLength) + responseJSON.mode) / (sessionLength + 1)).toFixed(3)
              document.getElementById('mode').innerHTML = responseJSON.mode
              sessionLength = sessionLength + 1
            })
            .catch(function (error) {
              console.error(error)
            })
          // getting recommendations
          if (document.getElementById('danceabilityAvg')) {
            let mostArtists = Object.keys(artists)
            if (mostArtists.length > 3) {
              mostArtists = pickHighest(artists, 3)
            }
            let mostGenres = Object.keys(genres)
            if (mostGenres.length > 2) {
              mostGenres = pickHighest(genres, 2)
            }
            var params = new URLSearchParams({
              limit: 20,
              seed_artists: mostArtists.join(','),
              seed_genres: mostGenres[0],
              seed_tracks: state.track_window.current_track.id,
              target_danceability: Number(document.getElementById('danceabilityAvg').innerHTML),
              target_energy: Number(document.getElementById('energyAvg').innerHTML),
              target_acousticness: Number(document.getElementById('acousticnessAvg').innerHTML),
              targetSpeechiness: Number(document.getElementById('speechinessAvg').innerHTML),
              target_liveness: Number(document.getElementById('livenessAvg').innerHTML),
              target_valence: Number(document.getElementById('valenceAvg').innerHTML),
              target_tempo: Number(document.getElementById('tempoAvg').innerHTML),
              target_loudness: Number(document.getElementById('loudnessAvg').innerHTML)
            })
            axios.get('https://api.spotify.com/v1/recommendations?' + params)
              .then(function (response) {
                let responseJSON = JSON.parse(response.request.response)
                let random = responseJSON.tracks.sort(() => 0.5 - Math.random()).slice(0, 8)
                for (var k = 0; k < random.length; k++) {
                  document.getElementById('rec' + k).innerHTML = random[k].name
                  document.getElementById('rec' + k).onclick = function (e) {
                    var track = random[e.target.id.slice(-1)]
                    console.log(track)
                    axios.post('https://api.spotify.com/v1/me/player/queue?uri=' + track.uri)
                      .then(function (response) { console.log(response) })
                      .catch(function (error) { console.error(error) })
                  }
                }
              })
              .catch(function (error) {
                console.error(error)
              })
          }
        }
        prevPos = state.position
      })

      player.connect()
    }
  }, [])

  if (!is_active) {
    return (
      <>
        <div className='container'>
          <div className='main-wrapper'>
            <b> Instance not active. Transfer your playback using your Spotify app </b>
          </div>
        </div>
      </>)
  } else {
    return (
      <>
        <div className='container'>
          <div className='main-wrapper'>

            <img src={current_track.album.images[0].url} className='now-playing__cover' alt='' />

            <div className='now-playing__side'>
              <div className='now-playing__name'>{current_track.name}</div>
              <div className='now-playing__artist'>{current_track.artists[0].name}</div>

              <button className='btn-spotify' onClick={() => { player.previousTrack() }}>
                &lt;&lt;
              </button>

              <button className='btn-spotify' onClick={() => { player.togglePlay() }}>
                {is_paused ? 'PLAY' : 'PAUSE'}
              </button>

              <button className='btn-spotify' onClick={() => { player.nextTrack() }}>
                &gt;&gt;
              </button>
            </div>
            <div id='analysis'>
              <a class='stat'>Genre :{'\u00A0'}<span id='statGenre'></span></a><br></br>
              <a class='stat'>danceability :{'\u00A0'}<span class='statSpan' id='danceability'></span>{'\u00A0'}Average :{'\u00A0'}<span class='statSpan' id='danceabilityAvg'>0</span></a><br></br>
              <a class='stat'>energy :{'\u00A0'}<span class='statSpan' id='energy'></span>{'\u00A0'}Average :{'\u00A0'}<span class='statSpan' id='energyAvg'>0</span></a><br></br>
              <a class='stat'>acousticness :{'\u00A0'}<span class='statSpan' id='acousticness'></span>{'\u00A0'}Average :{'\u00A0'}<span class='statSpan' id='acousticnessAvg'>0</span></a><br></br>
              <a class='stat'>instrumentalness :{'\u00A0'}<span class='statSpan' id='instrumentalness'></span>{'\u00A0'}Average :{'\u00A0'}<span class='statSpan' id='instrumentalnessAvg'>0</span></a><br></br>
              <a class='stat'>speechiness :{'\u00A0'}<span class='statSpan' id='speechiness'></span>{'\u00A0'}Average :{'\u00A0'}<span class='statSpan' id='speechinessAvg'>0</span></a><br></br>
              <a class='stat'>liveness :{'\u00A0'}<span class='statSpan' id='liveness'></span>{'\u00A0'}Average :{'\u00A0'}<span class='statSpan' id='livenessAvg'>0</span></a><br></br>
              <a class='stat'>valence :{'\u00A0'}<span class='statSpan' id='valence'></span>{'\u00A0'}Average :{'\u00A0'}<span class='statSpan' id='valenceAvg'>0</span></a><br></br>
              <a class='stat'>tempo :{'\u00A0'}<span class='statSpan' id='tempo'></span>{'\u00A0'}Average :{'\u00A0'}<span class='statSpan' id='tempoAvg'>0</span></a><br></br>
              <a class='stat'>loudness :{'\u00A0'}<span class='statSpan' id='loudness'></span>{'\u00A0'}Average :{'\u00A0'}<span class='statSpan' id='loudnessAvg'>0</span></a><br></br>
              <a class='stat'>mode :{'\u00A0'}<span class='statSpan' id='mode'></span>{'\u00A0'}Average :{'\u00A0'}<span class='statSpan' id='modeAvg'>0</span></a><br></br>
              <button id='resetButton'>reset</button><br></br>
            </div>
            <div id='recs'>
              <button class='rec' id='rec0'></button><br></br>
              <button class='rec' id='rec1'></button><br></br>
              <button class='rec' id='rec2'></button><br></br>
              <button class='rec' id='rec3'></button><br></br>
              <button class='rec' id='rec4'></button><br></br>
              <button class='rec' id='rec5'></button><br></br>
              <button class='rec' id='rec6'></button><br></br>
              <button class='rec' id='rec7'></button><br></br>
            </div>
          </div>
        </div>
      </>
    )
  }
}

export default WebPlayback
