package io.yetanotherwhatever;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Vector;
import java.util.Date;
import java.util.Iterator;
import java.util.Map;

import org.json.JSONException;
import org.json.JSONObject;

import com.amazonaws.AmazonClientException;
import com.amazonaws.AmazonServiceException;
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClient;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Index;
import com.amazonaws.services.dynamodbv2.document.Item;
import com.amazonaws.services.dynamodbv2.document.ItemCollection;
import com.amazonaws.services.dynamodbv2.document.PutItemOutcome;
import com.amazonaws.services.dynamodbv2.document.QueryOutcome;
import com.amazonaws.services.dynamodbv2.document.Table;
import com.amazonaws.services.dynamodbv2.document.spec.QuerySpec;
import com.amazonaws.services.dynamodbv2.document.utils.ValueMap;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.S3Event;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.event.S3EventNotification.S3EventNotificationRecord;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.StorageClass;


public class TestOutputUpload implements RequestHandler<S3Event, String> {

	static String NL = System.lineSeparator();
	
	private String m_bucketName, m_key;

	private LambdaLogger logger;

	private Vector<String> m_perfLog = new Vector<String>();
	private Instant m_previous, m_current;
	private long m_totalTime = 0;
	
	//instantiated by test harness, and AWS Lambda
	public TestOutputUpload()
	{
		
	}
	
	private TestOutputUpload(S3EventNotificationRecord s, Context context)
	{
		logger = context.getLogger();
		
		initTimer();
		
		//read params
    	m_bucketName = s.getS3().getBucket().getName();
    	m_key = s.getS3().getObject().getKey();
	}
	
	private void initTimer()
	{
    	m_previous = Instant.now();
	}
	
	private void addPerf(String msg)
	{
		m_current = Instant.now();
		long diff = ChronoUnit.MILLIS.between(m_previous,m_current);
	    m_previous = m_current;
	    
	    m_perfLog.add(msg + " = " + diff);
	    
	    m_totalTime += diff;
	}
	
	private void logPerf()
	{
		Iterator<String> iter = m_perfLog.iterator();
		while (iter.hasNext())
		{
			logger.log(iter.next());
		}

    	logger.log("Total time = " + (m_totalTime) + " ms.");
	}
	
	private JSONObject readObjectMetadata(S3Object testOutputFile) throws JSONException
	{        
		Map<String, String> m = testOutputFile.getObjectMetadata().getUserMetadata();
        String id = m.get("id");
        logger.log(id);
        
        return new JSONObject(id);
	}
	
	private Item lookupRegistration(String lls)
	{
		DynamoDB dynamoDB = new DynamoDB(new AmazonDynamoDBClient());

		Table table = dynamoDB.getTable("CandidateRegistration");
		Index index = table.getIndex("lls-index");

		QuerySpec spec = new QuerySpec()
		    .withKeyConditionExpression("lls = :lls")
		    .withValueMap(new ValueMap()
		        .withString(":lls", lls));

		ItemCollection<QueryOutcome> items = index.query(spec);
		Iterator<Item> iter = items.iterator(); 
		
		//just take the first (it's a UUID)
		if (iter.hasNext())
		{
			Item i = iter.next();
			logger.log("Registration found: " + i.toJSONPretty());
			return i;
		}
		
		//no registration found
		return null;
	}
	
	private String testOutput()
	{
        //log
    	logger.log("S3 bucket: " + m_bucketName + NL);
    	logger.log("S3 key: " + m_key + NL);
        
    	addPerf("Time to parse params");
        
    	//read uploaded output
        logger.log("Reading file: " + m_key + NL);
    	AmazonS3 client = new AmazonS3Client();
        S3Object testOutputFile = client.getObject(m_bucketName, m_key);
        InputStream testOutputStream= testOutputFile.getObjectContent();

    	addPerf("Time to fetch uploaded output");
    	
        //process metadata params
        logger.log("Reading object metadata");
        String home = "";
    	String problemName = "";
    	String resultsKey = "";
    	String lls = "";
    	String uuid = "";
        try
        {
            JSONObject s3md = readObjectMetadata(testOutputFile);
	    	lls = s3md.getString("lls");
	    	uuid = s3md.getString("uuid");
	    	problemName = s3md.getString("problemname");
	    	resultsKey = getResultsKey(lls, uuid);
        }
        catch(JSONException jse)
        {
        	logger.log("Unexpected error parsing upload metadata: " + jse.getMessage());

        	try
        	{
            	testOutputStream.close();	
        	}
        	catch (IOException ioe)
        	{
        		logger.log(ioe.getMessage());
        	}
        	
        	return null;
        }
        
        //lookup registration
        Item reg = lookupRegistration(lls);
        if (reg != null)
        {
        	home = reg.getString("url");
        }
        else
        {
        	String problemPageKey = "problems/" + problemName + ".html";
        	
        	try
        	{
                S3Object problemPageObj = client.getObject("yetanotherwhatever.io", problemPageKey);
        	}
        	catch (AmazonServiceException e) {
	    	    String errorCode = e.getErrorCode();
	    	    if (errorCode.equals("NoSuchKey")) {
	    	        logger.log("Problem page not found: " + problemPageKey);
	    	    }
	    	    throw e;
    	    }
        	
            home = "http://yetanotherwhatever.io/" + problemPageKey;
        	
        }

    	addPerf("Time to read object metadata");
    	
    	//logging params
    	logger.log("Metadata home: " + home);
    	logger.log("S3 problemName: " + problemName + NL);
    	logger.log("S3 results key: " + resultsKey + NL);
        String expectedOutputKey = "solutions/" + problemName +  "-out.txt";
        logger.log("S3 solution key: " + expectedOutputKey + NL);
        
    	//read expected output
        logger.log("Reading file: " + expectedOutputKey + NL);            
        S3Object expectedOutputFile = client.getObject(m_bucketName, expectedOutputKey);
        InputStream expectedOutputStream = expectedOutputFile.getObjectContent();

    	addPerf("Time to read fetch expected output");
                
        //compare files
        String result =  compareStreams(testOutputStream, expectedOutputStream, problemName, home, lls);

    	try
    	{
            testOutputStream.close();
            expectedOutputStream.close();	
    	}
    	catch (IOException ioe)
    	{
    		logger.log(ioe.getMessage());
    	}

    	addPerf("Time to compare streams");
    	
    	//publish results
    	//for redirect
    	//from submitting.html: window.location = "http://yetanotherwhatever.io/results/" + cookiePlusFileName + ".html";
    	logger.log("Result: " + result + NL);            
        saveResultToS3(result, resultsKey, logger);
        
        //time performance
    	addPerf("Time to save results");
    	
    	//log performance results
    	logPerf();
    	
        return result;
	}
		
    @Override
    //entry point for Lambda
    public String handleRequest(S3Event input, Context context) {
    	
        for (S3EventNotificationRecord s : input.getRecords())
        {
        	TestOutputUpload process = new TestOutputUpload(s, context);
        	       	            	
        	String results = process.testOutput();
        	
        	return results;
        }
        
        return null;
    }
    
    private String getResultsKey(String lls, String uuid) throws JSONException
    {   
        String resultsKey = "results/" + lls + "/" + uuid + ".html";
        
        return resultsKey;
    }
    
    private void saveResultToS3 (String result, String keyName, LambdaLogger logger) {

        final String bucketName     = "yetanotherwhatever.io";
        AmazonS3Client s3client = new AmazonS3Client(new DefaultAWSCredentialsProviderChain());
        String nl = System.lineSeparator();        
        
        String content = "<html><head><meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" /></head><body lang=EN-US><div class=mainDiv><p class=result>" +
        		result + "</p></div></body></html>";

    	logger.log("Saving result to: " + keyName + nl);
            try {          
                InputStream stream = new ByteArrayInputStream(
                		content.getBytes(StandardCharsets.UTF_8));
                String bucket = bucketName;
                ObjectMetadata metadata = new ObjectMetadata();
                metadata.setContentType("text/html");
                PutObjectRequest put = new PutObjectRequest(bucket, keyName,
                        stream, metadata).withCannedAcl(CannedAccessControlList.PublicRead);
                put.setStorageClass(StorageClass.ReducedRedundancy);
                put.setMetadata(metadata);
                s3client.putObject(put);
                               

            } catch (AmazonServiceException ase) {
                logger.log("Caught an AmazonServiceException, which " +
                        "means your request made it " +
                        "to Amazon S3, but was rejected with an error response" +
                        " for some reason." + nl);
                logger.log("Error Message:    " + ase.getMessage() + nl);
                logger.log("HTTP Status Code: " + ase.getStatusCode() + nl);
                logger.log("AWS Error Code:   " + ase.getErrorCode() + nl);
                logger.log("Error Type:       " + ase.getErrorType() + nl);
                logger.log("Request ID:       " + ase.getRequestId() + nl);
            } catch (AmazonClientException ace) {
                logger.log("Caught an AmazonClientException, which " +
                        "means the client encountered " +
                        "an internal error while trying to " +
                        "communicate with S3, " +
                        "such as not being able to access the network." + nl);
                logger.log("Error Message: " + ace.getMessage() + nl);
                logger.log(ace.getStackTrace().toString() + nl);
            } catch (Throwable t) {
            	logger.log("Error encountered while saving results." + nl);
            	t.printStackTrace();
            }
    }
    
    private static String getErrorString(String problemName, String home)
    {
    	StringBuilder sb = new StringBuilder();
    	
    	sb.append("</p></div>");
    	
    	if (problemName.contains(".combos"))
    	{
    		//custom tips here
    		sb.append("<div>Did you remember to...<ul>"
				+ "<li>Add a \"Case #X\" before each set of combinations? (see the <a href=\"http://yetanotherwhatever.io/" + problemName + ".html#sample\">\"Sample\"</a> section of the instructions)</li>"
				+ "<li>Sort your combinations alphabetically?</li>"
				+ "<li>Print each combination on it's own line?  (See  the <a href=\"http://yetanotherwhatever.io/" + problemName + ".html#output\">\"Output\"</a> section of the instructions)</li>"
				+ "</ul></div>");
    	}
    	
    	sb.append("<div><p><a href=\"" + home + "\">Return to the main page</a>");
    	
    	return sb.toString();
    }
    
    private static String getExtendedSuccessString(String problemName, String home)
    {
    	StringBuilder sb = new StringBuilder();
    	
    	sb.append("<p><a href=\"" + home + "#submit\">Return to the main page and submit your code!</a></p>");
    	
    	return sb.toString();
    }
    
    private void saveSubmitOutputHist(String lls, boolean success)
    {
    	AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard().build();
    	DynamoDB dynamoDB = new DynamoDB(client);

    	Table table = dynamoDB.getTable("Output_Submit_Hist");

    	// Build the item
    	Date now = new Date();
    	Item item = new Item()
    	    .withPrimaryKey("lls", lls)
    	    .withNumber("epochTime", now.getTime())
    	    .withString("date", now.toString())
    	    .withBoolean("succeeded", success);

    	// Write the item to the table 
    	PutItemOutcome outcome = table.putItem(item);
    	
    	logger.log(outcome.toString());
    }
    
    private String compareStreams(InputStream attempt, InputStream ref, String problemName, String home, String lls)
    {
    	
        BufferedReader aIn = new BufferedReader(new InputStreamReader(attempt));
        BufferedReader rIn = new BufferedReader(new InputStreamReader(ref));
        String aLine = null;
        String rLine = null;

        //print first 3 lines
        int i = 1;
    	
        String result = "";
    	boolean success = false;
    	
    	int maxLinesAllowed = 11000;
    	
        while(i < maxLinesAllowed)
        {
        	
        	try
        	{
        		aLine = aIn.readLine();
        		if (aLine != null) aLine = aLine.trim();
        		rLine = rIn.readLine();
        		if (rLine != null) rLine = rLine.trim();
        		String nl = System.lineSeparator();
        		if (aLine != null && rLine != null && !aLine.equals(rLine))
        		{
        			result = "Your solution is incorrect." + nl
        					+ "The first incorrect line is line " + i + "." + nl
        					+ "The correct output is: \"" + rLine + "\"" + nl;
        					//+ "but read \"" + aLine + "\""
        			
        			break;
        		}
        		else if (aLine == null && rLine == null)	//reached end of both files
        		{
        			success = true;
        			result = "Success!!  Your solution is correct!";
        			break;
        		}
        		else if (aLine == null)	//reached end of uploaded file
        		{
        			result = "Your solution is incorrect." + nl
        					+ "File too short.";
        			break;
        		}
        		else if (rLine == null)
        		{
        			result = "Your solution is incorrect." + nl
        					+ "File too long.  You may want to check for unnecessary newlines at end of your output.";
        			break;
        		}
        		

        	}
        	catch (IOException e)
        	{
        		result = "An i/o error occured while processing line " + i;
        		logger.log(e.toString());
        		break;
        	}
        	
        	i++;
        }
        
        if (i > maxLinesAllowed)
        	result = "Max file lines exceeded.";
        

        if (success)
        {
        	result += getExtendedSuccessString(problemName, home);
        }
        else
        {
			result += getErrorString(problemName, home);
        }
        
		saveSubmitOutputHist(lls, success);
		
		return result;
    }

}
 