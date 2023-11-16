const express= require('express');
const app=express();
const PORT=process.env.PORT || 3000;

const updateDB=require('./updateDB')
const fetchDetails=require('./fetchDetails')

app.use('/updateDB',updateDB);
app.use('/fetchDetails',fetchDetails);

app.listen(PORT,()=>{console.log("Listening to port "+PORT);})
