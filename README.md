# Weather  
Sample weather api.


### Config  
Sample config located in: `./conf/default.json`


### App start  
**To start app run:**  
`node app.js`  
**Command line args:**  
`-l`, `--level` - Log level (default = `1`)  
`-c`, `--conf` - Path to config (default = `./conf/default.json`)  
To stop just send SIGINT/SIGHUP, or ^C.


### Console client  
**Get new token:**  
`curl http://127.0.0.1:8080/token`  
**Response:**  
`{"token":"b2ced4e0-82e1-11e5-8932-fbd41f16b187"}`

**Get weather for city (new id generated for each unique city):**  
`curl -H "Authorization: Bearer b2ced4e0-82e1-11e5-8932-fbd41f16b187" http://127.0.0.1:8080/weather/moscow`  
**Response:**  
`{"id":"56d6bb30-823c-11e5-8a16-8b6b8f7d8838","temperature":8,"humidity":78,"pressure":1008}`

**Get weather for city by id:**  
`curl -H "Authorization: Bearer b2ced4e0-82e1-11e5-8932-fbd41f16b187" http://127.0.0.1:8080/weather/56d6bb30-823c-11e5-8a16-8b6b8f7d8838`  
**Response:**  
`{"id":"56d6bb30-823c-11e5-8a16-8b6b8f7d8838","temperature":8,"humidity":78,"pressure":1008}`

**Get weather for city for date (data for current date accumulated at 3 AM UTC in default config):**  
`curl -H "Authorization: Bearer b2ced4e0-82e1-11e5-8932-fbd41f16b187" http://127.0.0.1:8080/weather/moscow/2015/11/04`  
**Response:**  
`{"id":"56d6bb30-823c-11e5-8a16-8b6b8f7d8838","temperature":8,"humidity":78,"pressure":1008}`

**Get weather for city by id for date:**  
`curl -H "Authorization: Bearer b2ced4e0-82e1-11e5-8932-fbd41f16b187"   http://127.0.0.1:8080/weather/56d6bb30-823c-11e5-8a16-8b6b8f7d8838/2015/11/04`  
**Response:**  
`{"id":"56d6bb30-823c-11e5-8a16-8b6b8f7d8838","temperature":8,"humidity":78,"pressure":1008}`
