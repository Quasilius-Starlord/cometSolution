const express = require('express');
const router = express.Router();
const MongoDB=require('./../MongoDB/MongoDB');
require('dotenv').config();
// const axios=require('axios');
const requestINT=require('request');

// const axios=require()

const features=require('./../Features/features')

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

module.exports = () => {

    //differentiate between admin and user
    const differentiate = async (request, response, next)=>{
        // assuming user is authentic
        try{
            const mongodb = new MongoDB();
            const res=await mongodb.getAdminFromEmail(request.body.email);
            if(res==null){
                return response.sendStatus(404);
            }
            console.log(res)
            if(res.admin===true)
                next();
            else
                return response.sendStatus(401);
        }catch(err){
            console.log(err);
        }
    }

    const userExclusive = async (request, response, next)=>{
        // assuming user is authentic
        try{
            const mongodb = new MongoDB();
            const res=await mongodb.getAdminFromEmail(request.body.email);
            if(res==null){
                return response.sendStatus(404);
            }
            console.log(res)
            if(res.admin===false)
                next();
            else
                return response.sendStatus(401);
        }catch(err){
            console.log(err);
        }
    }

    router.post('/add',features.authenticate, differentiate, async (request, response)=>{
        try{
            const questionData={
                name:request.body.name,
                body:request.body.description,
                masterjudgeId:1001
            }
            console.log(questionData);
            

            requestINT({
                url:`https://${process.env.PROBLEMS_END_POINT}/api/v4/problems?access_token=${process.env.PROBLEMS_TOKEN}`,
                method:'POST',
                form:questionData,

            },async function (error, res, body) {
    
                if (error) {
                    console.log('Connection problem');
                }
                
                // process response
                if (res) {
                    if (res.statusCode === 201) {
                        // console.log('done')
                        try {
                            const data=JSON.parse(res.body)
                            console.log(data); // problem data in JSON

                            const client=new MongoDB();
                            const questionRes=await client.addQuestion(request.body.email,data.id);
                            if(questionRes){
                                return response.json({questionID:questionRes})
                            }else{
                                return response.json({response:false})
                            }
                            response.json(JSON.parse(res.body));
                        } catch (error) {
                            console.log(err);
                        }
                    } else {
                        return response.sendStatus(401);
                        if (res.statusCode === 401) {
                            console.log('Invalid access token');
                        } else if (res.statusCode === 400) {
                            var body = JSON.parse(res.body);
                            console.log('Error code: ' + body.error_code + ', details available in the message: ' + body.message)
                        }
                    }
                }
            })
            return;
        }catch(err){
            console.log(err);
        }
    })

    router.patch('/edit',features.authenticate, differentiate,async (request, response)=>{
        console.log(request.body)
        try{
            const email=request.body.email;
            const problemid=request.body.problemid;

            const problemData={
                name:request.body.updatedName,
                body:request.body.updatedQuestion
            }

            const client = new MongoDB();
            const editres=await client.editQuestion(email,problemid);

            if(editres===false)
                return response.sendStatus(401);

            requestINT({
                url: `https://${process.env.PROBLEMS_END_POINT}/api/v4/problems/${problemid}?access_token=${process.env.PROBLEMS_TOKEN}`,
                method: 'PUT',
                form: problemData
            },async function (error, res, body) {
                
                if (error) {
                    console.log('Connection problem');
                }
                
                // process response
                if (res) {
                    if (res.statusCode === 200) {
                        console.log('Problem updated');
                        return response.json({response:true});
                    } else {
                        if (res.statusCode === 401) {
                            console.log('Invalid access token');
                        } else if (res.statusCode === 403) {
                            console.log('Access denied');
                        } else if (res.statusCode === 404) {
                            console.log('Problem does not exist');
                        } else if (res.statusCode === 400) {
                            var body = JSON.parse(res.body);
                            console.log('Error code: ' + body.error_code + ', details available in the message: ' + body.message)
                        }
                    }
                }
            });
            return;
        }catch(err){
            console.log(err);
        }
    })

    router.delete('/delete',features.authenticate, differentiate, async(request, response)=>{
        console.log(request.body)
        try{
            const email=request.body.email;
            const problemid=request.body.problemid;
            const client = new MongoDB();
            const delres=await client.deleteQuestion(email,problemid);

            if(delres===false)
                return response.sendStatus(401);

            requestINT({
                url: `https://${process.env.PROBLEMS_END_POINT}/api/v4/problems/${problemid}?access_token=${process.env.PROBLEMS_TOKEN}`,
                method: 'DELETE'
            },async function (error, res, body) {
                if (error) {
                    console.log('Connection problem');
                }
                
                // process response
                if (res) {
                    if (res.statusCode === 200) {
                        console.log('Problem deleted');
                        return response.json(delres);

                    } else {
                        if (res.statusCode === 401) {
                            console.log('Invalid access token');
                        } else if (res.statusCode === 403) {
                            console.log('Access denied');
                        } else if (res.statusCode === 404) {
                            console.log('Problem not found');
                        }
                    }
                }
            });
            return;
            return res ? response.json(res) : response.sendStatus(401);
        }catch(err){
            console.log(err);
        }
        response.json({working:true})
    })

    router.post('/', async (request, response)=>{
        try {
            const name=request.body.name;
            const description=request.body.description;
            const masterjudgeId=1001;

            axios.post(``)
        } catch (error) {
            console.log(error);
        }
        response.json({response:'working'})
    })

    router.post('/addtestcases',features.authenticate, differentiate, async (request, response)=>{
        try {
            const problemid=request.body.problemid;
            const email=request.body.email;

            const client=new MongoDB();
            const owner=await client.checkownership(email, problemid);
            if(owner===false)
                return response.sendStatus(401);
            
            const testcaseData={
                input: request.body.input,
                output: request.body.output,
                timelimit: request.body.timelimit,
                judgeId: request.body.judgeId
            }
            requestINT({
                url: `https://${process.env.PROBLEMS_END_POINT}/api/v4/problems/${problemid}/testcases?access_token=${process.env.PROBLEMS_TOKEN}`,
                method: 'POST',
                form: testcaseData
            },async function (error, res, body) {
                
                if (error) {
                    console.log('Connection problem');
                }
                
                // process response
                if (res) {
                    if (res.statusCode === 201) {
                        try {
                            const data=JSON.parse(res.body)
                            console.log(data); // testcase data in JSON
                            const testres = await client.addTestCases(problemid, data.number);

                            return response.json(testres);
                        } catch (error) {
                            console.log(error)
                        }
                    }
                    else {
                        if (res.statusCode === 401) {
                            console.log('Invalid access token');
                        } else if (res.statusCode === 403) {
                            console.log('Access denied');
                        } else if (res.statusCode === 404) {
                            console.log('Problem does not exist');
                        } else if (res.statusCode === 400) {
                            var body = JSON.parse(res.body);
                            console.log('Error code: ' + body.error_code + ', details available in the message: ' + body.message)
                        }
                    }
                }
            });

        } catch (error) {
            console.log(err);
        }
    })

    router.post('/register',async (request,response)=>{
        console.log(request.body);
        try{
            const res=await features.signup(request.body.name, request.body.email, request.body.password, request.body.admin)
            return response.json(res);
        }catch(err){
            console.log(err)
        }
    });

    router.post('/login',async (request, response)=>{
        try{
            const res=await features.login(request.body.email, request.body.password);
            return response.json(res);
        }catch(err){
            console.log(err)
        }
        response.json({});
    });

    router.post('/submit',features.authenticate,(request, response)=>{
        
        const submissionData = {
            problemId: request.body.problemid,
            compilerId: request.body.compilerid,
            source: request.body.source
        };

        requestINT({
            url: `https://${process.env.PROBLEMS_END_POINT}/api/v4/submissions?access_token=${process.env.PROBLEMS_TOKEN}`,
            method: 'POST',
            form: submissionData
        },async function (error, res, body) {
            
            if (error) {
                console.log('Connection problem');
            }
            
            // process response
            if (res) {
                if (res.statusCode === 201) {
                    try {
                        const data=JSON.parse(res.body)
                        console.log(data); // submission data in JSON
                        await sleep(3500);

                        requestINT({
                            url: `https://${process.env.PROBLEMS_END_POINT}/api/v4/submissions/${data.id}?access_token=${process.env.PROBLEMS_TOKEN}`,
                            method: 'GET'
                        }, function (error, res, body) {
                            
                            if (error) {
                                console.log('Connection problem');
                            }
                            
                            // process response
                            if (res) {
                                if (res.statusCode === 200) {
                                    const result=JSON.parse(res.body)
                                    console.log(result); // submission data in JSON
                                    
                                    response.json(result.result.status)
                                } else {
                                    if (res.statusCode === 401) {
                                        console.log('Invalid access token');
                                    } else if (res.statusCode === 403) {
                                        console.log('Access denied');
                                    } else if (res.statusCode === 404) {
                                        console.log('Submision not found');
                                    }
                                }
                            }
                        });

                    } catch (error) {
                        console.log(err);
                    }
                } else {
                    if (res.statusCode === 401) {
                        console.log('Invalid access token');
                    } else if (res.statusCode === 402) {
                        console.log('Unable to create submission');
                    } else if (res.statusCode === 400) {
                        var body = JSON.parse(res.body);
                        console.log('Error code: ' + body.error_code + ', details available in the message: ' + body.message)
                    }
                }
            }
        });

        return;
    })

    return router;
}