const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');

class MongoDB{
    constructor(){
        this.url="mongodb://localhost:27017";
        this.client = null;
        this.databaseName = 'Comed';
        this.userCollection = 'Users';
        this.questionsCollection = 'Questions';
    }

    async connect(){
        const mongoClient=new MongoClient(this.url,{ useNewUrlParser: true, useUnifiedTopology: true, serverApi:ServerApiVersion.v1 });
        try{
            this.client=await mongoClient.connect();
            console.log('conntected successfulklu');
        }catch(err){
            console.log(err);
        }

        return this.client;
    };

    async insertOneUserData(UserData){
        try{
            const client=await this.connect();
            const record=await client.db(this.databaseName).collection(this.userCollection).countDocuments({'email':UserData.email});
            if(record!=0)
                return{response:false,error:'User already exists'};
            const id=await client.db(this.databaseName).collection(this.userCollection).insertOne(UserData);
            console.log(`inserted id ${id.insertedId}`);
        }catch(err){
            console.log(err);
        }finally{
            this.disconnect();
        }
        return {response:true}
    }

    async getUserByEmail(email) {
        try {
            const client = await this.connect();
            const user = await client.db(this.databaseName).collection(this.userCollection).findOne({ email: email },{projection:{email:1,_id:1,password:1}});
            console.log(user);
            return user;
        } catch (err) {
            console.log(err);
        } finally {
            await this.disconnect();
        }
    }

    async getAdminFromEmail(email){
        try {
            const client = await this.connect();
            const user = await client.db(this.databaseName).collection(this.userCollection).findOne({ email: email },{projection:{admin:1,_id:1}});
            return user;
        } catch (err) {
            console.log(err);
        } finally {
            await this.disconnect();
        }
    }

    async addQuestion(email, problemid){
        // question must be sanatized
        try{
            const user=await this.getUserByEmail(email);
            
            if(user==null)
            return null;
            
            console.log(user);
            const questionObj={
                owner:user._id,
                problemid:problemid,
                testCases:[]
            }
            // console.log(questionObj)
            const client=await this.connect();

            const id=await this.client.db(this.databaseName).collection(this.questionsCollection).insertOne(questionObj);
            if(id.acknowledged){
                const res=await this.client.db(this.databaseName).collection(this.userCollection).updateOne({_id:user._id},{$push:{
                    postedQuestions:id.insertedId
                }})
            }
            console.log(id)
            return id.acknowledged ? id.insertedId.toString() : id.acknowledged;
        }catch(err){
            console.log(err);
        }finally{
            await this.disconnect();
        }
    }

    async #ownership(email, problemid){
        try{
            const user=await this.getUserByEmail(email);
            const client=await this.connect();

            console.log(user)
            const questionRes=await this.client.db(this.databaseName).collection(this.questionsCollection).findOne({problemid:problemid},{projection:{_id:1,owner:1}});

            if(questionRes==null)
                return false;
            
            console.log('owner',user._id.equals(questionRes.owner))
            if(!user._id.equals(questionRes.owner)){
                return false;
            }
            return true
        }catch(err){
            console.log(err);
            return false;
        }

        //not disconnecting assuming caller function would disconnect
    }

    async editQuestion(email, problemid){
        try{
            const ownershipStatus=await this.#ownership(email,problemid);
            if(!ownershipStatus)
                return false;
            
            return true;
        }catch(err){
            console.log(err);
            return false;
        }finally{
            await this.disconnect();
        }
    }

    async deleteQuestion(email, problemid){
        try {
            const ownershipStatus=await this.#ownership(email,problemid);
            if(!ownershipStatus)
                return false;
            const deadProblem=await this.client.db(this.databaseName).collection(this.questionsCollection).findOne({problemid:problemid},{projection:{_id:1}});
            

            const res=await this.client.db(this.databaseName).collection(this.questionsCollection).deleteOne({problemid:problemid});
            await this.client.db(this.databaseName).collection(this.userCollection).updateOne({email:email},{$pull:{postedQuestions:{$eq:deadProblem._id}}});
            return res;
        } catch (error) {
            console.log(error);
            return false;
        }finally{
            await this.disconnect();
        }
    }

    async checkownership(email, problemid){
        try {
            const own=await this.#ownership(email,problemid);
            return own;
        } catch (error) {
            console.log(err);
        }finally{
            await this.disconnect();
        }
    }

    async addTestCases(problemid, testcasenumber){
        try {
            const client=await this.connect()
            const res=await this.client.db(this.databaseName).collection(this.questionsCollection).updateOne({problemid:problemid},{$push:{
                testCases:testcasenumber
            }})
            return res;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    async disconnect() {
        if (this.client) {
            console.log('successfully disconnected');
            return await this.client.close();
        } else
            return false;
    }

}

module.exports = MongoDB;
