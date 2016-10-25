package io.yetanotherwhatever;

import sun.misc.BASE64Encoder;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;


/*
Based on
http://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-authentication-HTTPPOST.html
http://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-HTTPPOSTConstructPolicy.html
http://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-authenticating-requests.html
http://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-UsingHTTPPOST.html
 */


public class AWSv4Signer {

    static byte[] HmacSHA256(String data, byte[] key) throws Exception  {
        return HmacSHA256(data.getBytes("UTF-8"), key);
    }


    static byte[] HmacSHA256(byte[] data, byte[] key) throws Exception  {
        String algorithm="HmacSHA256";
        Mac mac = Mac.getInstance(algorithm);
        mac.init(new SecretKeySpec(key, algorithm));
        return mac.doFinal(data);
    }

    /*
    based on http://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html
     */
    static byte[] getSignatureKey(String key, String dateStamp, String regionName, String serviceName) throws Exception  {
        byte[] kSecret = ("AWS4" + key).getBytes("UTF8");
        byte[] kDate    = HmacSHA256(dateStamp, kSecret);
        byte[] kRegion  = HmacSHA256(regionName, kDate);
        byte[] kService = HmacSHA256(serviceName, kRegion);
        byte[] kSigning = HmacSHA256("aws4_request", kService);
        return kSigning;
    }

    public static void signPolicy(String policy_document, String aws_secret_key, String dateStamp, String region, String serviceName)
    {

        try {
            policy_document = policy_document.replaceAll("\\s", "");
            String b64_policy_doc = (new BASE64Encoder()).encode(
                    policy_document.getBytes("UTF-8"));


            byte[] signatureKey = getSignatureKey(aws_secret_key, dateStamp, region, serviceName);

            String stringToSign = b64_policy_doc;
            byte[] signingKey = signatureKey;

            byte[] hash = HmacSHA256(stringToSign, signingKey);
            final StringBuilder builder = new StringBuilder();
            for(byte b : hash) {
                builder.append(String.format("%02x", b));
            }
            String signature = builder.toString();


            System.out.println("string to sign");
            System.out.println(stringToSign);
            System.out.println("sig");
            System.out.println(signature);

        } catch(Exception e)
        {
            e.printStackTrace();
        }

    }

    public static void main(String[] args) {

        String aws_secret_key = args[1];
        String algorithm = "AWS4-HMAC-SHA256";
        //ATTN: AWS weirdness/bug
        //expiration will be calculate by S3 as max 7 days from x-amz-date
        //so set x-amz-date in the future if you want a longer expiration period
        //else you will encounter policy expired 403 errors when you submit your form 7 days past
        String dateStamp = "20170101";
        String region = "us-east-1";
        String serviceName = "s3";
        String bucket = "public.yetanotherwhatever.io";
        String accessKeyID = args[0];

        String solutionPolicyDoc = "{\n" +
                "  \"expiration\":\"2017-01-07T00:00:00Z\",\n" +
                "  \"conditions\": [\n" +
                "    {\"bucket\":\"" + bucket + "\"},\n" +
                "    [\"starts-with\",\"$key\",\"uploads/\"],\n" +
                "    {\"acl\":\"private\"},\n" +
                "    {\"success_action_redirect\":\"http://yetanotherwhatever.io/submitting.html\"},\n" +
                "    {\"x-amz-algorithm\":\"" + algorithm + "\"},\n" +
                "    {\"x-amz-credential\":\"" + accessKeyID + "/" + dateStamp + "/" + region + "/" + serviceName + "/aws4_request\"},\n" +
                "    {\"x-amz-date\":\"" + dateStamp + "T000000Z\"},\n" +
                "    {\"x-amz-storage-class\":\"REDUCED_REDUNDANCY\"},\n" +
                "    [\"content-length-range\",0,1048576]\n" +
                "  ]\n" +
                "}";



        String codePolicyDoc = "{\n" +
                "  \"expiration\":\"2017-01-07T00:00:00Z\",\n" +
                "  \"conditions\": [\n" +
                "    {\"bucket\":\"" + bucket + "\"},\n" +
                "    [\"starts-with\",\"$key\",\"code/\"],\n" +
                "    {\"acl\":\"private\"},\n" +
                "    {\"success_action_redirect\":\"http://yetanotherwhatever.io/thanks.html\"},\n" +
                "    {\"x-amz-algorithm\":\"" + algorithm + "\"},\n" +
                "    {\"x-amz-credential\":\"" + accessKeyID + "/" + dateStamp + "/" + region + "/" + serviceName + "/aws4_request\"},\n" +
                "    {\"x-amz-date\":\"" + dateStamp + "T000000Z\"},\n" +
                "    {\"x-amz-storage-class\":\"REDUCED_REDUNDANCY\"},\n" +
                "    [\"content-length-range\",0,1048576]\n" +
                "  ]\n" +
                "}";


        System.out.println("Solution policy: ");

        signPolicy(solutionPolicyDoc, aws_secret_key, dateStamp, region, serviceName);

        System.out.println("Code submission policy: ");
        signPolicy(codePolicyDoc, aws_secret_key, dateStamp, region, serviceName);
    }
}
