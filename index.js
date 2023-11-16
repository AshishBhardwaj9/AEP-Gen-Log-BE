const express= require('express');
const app=express();
const PORT=process.env.PORT || 3000;

const updateDB=require('./routes/updateDB')
const fetchDetails=require('./routes/fetchDetails')

app.use('/updateDB',updateDB);
app.use('/fetchDetails',fetchDetails);

app.listen(PORT,()=>{console.log("Listening to port "+PORT);})