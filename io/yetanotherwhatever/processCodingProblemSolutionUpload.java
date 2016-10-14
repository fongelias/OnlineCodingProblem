package io.yetanotherwhatever;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import com.amazonaws.AmazonClientException;
import com.amazonaws.AmazonServiceException;
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
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

public class processCodingProblemSolutionUpload implements RequestHandler<S3Event, String> {

    @Override
    public String handleRequest(S3Event input, Context context) {

    	LambdaLogger logger = context.getLogger();
    	
        for (S3EventNotificationRecord s : input.getRecords())
        {
        	Instant previous, current;
        	long parseMs = 0, compareMs = 0, saveMs = 0;
        	
        	previous = Instant.now();
        	    
        	String bucketName = s.getS3().getBucket().getName();
        	String key = s.getS3().getObject().getKey();
        	String prefix = null;
        	String plainKey = "";
        	String parentFolder = "uploads/";
        	int idx = key.indexOf(parentFolder);
        	if (idx == -1)
        	{
        		//unexpected
        		logger.log("Expected parent \"" + parentFolder + "\"folder not found");
        		return null;
        	}
        	plainKey = key.substring(idx + parentFolder.length());
        	idx = plainKey.indexOf('/');
        	if (idx != -1)
        	{
        		prefix = plainKey.substring(0, idx);
        		plainKey = plainKey.substring(idx + 1);
        	}
        	else
        	{
        		//unexpected
        		logger.log("No key prefix found");
        		return null;
        	}

        	String nl = System.lineSeparator();
        	logger.log("S3 bucket: " + bucketName + nl);
        	logger.log("S3 key: " + key + nl);
        	logger.log("S3 prefix: " + prefix + nl);
        	logger.log("S3 plain key: " + plainKey + nl);
            String slnKey = "solutions/" + prefix +  "-out.txt";
            logger.log("S3 solution key: " + slnKey + nl);
            
        	current = Instant.now();
        	if (previous != null) {
        		parseMs = ChronoUnit.MILLIS.between(previous,current);
        	    previous = current;
        	}
            
            logger.log("Reading file: " + key + nl);
        	AmazonS3 client = new AmazonS3Client();
            S3Object putFile = client.getObject(bucketName, key);
            InputStream putContents = putFile.getObjectContent();

            logger.log("Reading file: " + slnKey + nl);            
            S3Object slnFile = client.getObject(bucketName, slnKey);
            InputStream slnContents = slnFile.getObjectContent();
         
            String result =  compareStreams(putContents, slnContents, prefix);
        	
            current = Instant.now();
        	if (previous != null) {
        		compareMs = ChronoUnit.MILLIS.between(previous,current);
        	    previous = current;
        	}
            
            logger.log("Result: " + result + nl);            
            saveResultToS3(result, "results/" + plainKey + ".html", logger);
            
        	current = Instant.now();
        	if (previous != null) {
        		saveMs = ChronoUnit.MILLIS.between(previous,current);
        	    previous = current;
        	}
        	
        	logger.log("Time to parse = " + parseMs + " ms.");
        	logger.log("Time to compare = " + compareMs + " ms.");
        	logger.log("Time to save = " + saveMs + " ms.");
        	logger.log("Total time = " + (parseMs + compareMs + saveMs) + " ms.");
        	
            return result;
        }
        
        return null;
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
    
    private static String getErrorString(String prefix)
    {
    	if (prefix.equals("combos"))
    	{
    		return "</p></div><div>Did you remember to...<ul>"
				+ "<li>Add a \"Case #X\" before each set of combinations? (see the <a href=\"http://yetanotherwhatever.io/combos.html#sample\">\"Sample\"</a> section of the instructions)</li>"
				+ "<li>Sort your combinations alphabetically?</li>"
				+ "<li>Print each combination on it's own line?  (See  the <a href=\"http://yetanotherwhatever.io/combos.html#output\">\"Output\"</a> section of the instructions)</li>"
				+ "</ul></div><div><p><a href=\"http://yetanotherwhatever.io/" + prefix + ".html\">Return to the main page</a>";
    	}
    	else 
    	{
    		return "";
    	}
    }
    
    private static String getExtendedSuccessString(String prefix)
    {
    	if (prefix.equals("combos"))
    	{
    		return "<p><a href=\"http://yetanotherwhatever.io/combos.html#submit\">Return to the main page and submit your code!</a></p>";
    	}
    	else 
    	{
    		return "";
    	}
    }
    
    private static String compareStreams(InputStream attempt, InputStream ref, String prefix)
    {
        BufferedReader aIn = new BufferedReader(new InputStreamReader(attempt));
        BufferedReader rIn = new BufferedReader(new InputStreamReader(ref));
        String aLine = null;
        String rLine = null;

        //print first 3 lines
        int i = 1;
        while(i < 10000)
        {
        	try
        	{
        		aLine = aIn.readLine();
        		if (aLine != null) aLine = aLine.trim();
        		rLine = rIn.readLine();
        		if (rLine != null) rLine = rLine.trim();
        		String nl = System.lineSeparator();
        		if (aLine != null && !aLine.equals(rLine))
        		{
        			String result = "Your solution is incorrect." + nl
        					+ "The first incorrect line is line " + i + "." + nl;
        					//+ "Expected: \"" + rLine + "\"" + nl
        					//+ "but read \"" + aLine + "\""
        			
        			result += getErrorString(prefix);
        			
        			return result;
        			
        		}
        		else if (aLine == null && rLine == null)
        		{
        			return "Success!!  Your solution is correct!" + getExtendedSuccessString(prefix);
        		}
        		else if (aLine == null)
        		{
        			return "Your solution is incorrect." + nl
        					+ "File too short.";
        		}
        		else if (rLine == null)
        		{
        			return "Your solution is incorrect." + nl
        					+ "File too long.";
        		}
        	}
        	catch (IOException e)
        	{
        		return "Unexpected error on line " + i;
        	}
        	
        	i++;
        }
        
        return "Max file lines exceeded.";
    }

}
 