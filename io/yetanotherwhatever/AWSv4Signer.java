package io.yetanotherwhatever;

import sun.misc.BASE64Encoder;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;


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

    private static String b64Encode(String in)
    {
        String b64 = "";

        in = in.replaceAll("\\s", "");
        try
        {
            b64 = (new BASE64Encoder()).encode(
                    in.getBytes("UTF-8"));

        }
        catch(IOException ioe)
        {
            ioe.printStackTrace();
            System.exit(0);
        }

        return b64;
    }

    public static String signPolicy(String b64_policy_doc, String aws_secret_key, String dateStamp, String region, String serviceName)
    {
        try {

            byte[] signatureKey = getSignatureKey(aws_secret_key, dateStamp, region, serviceName);

            byte[] signingKey = signatureKey;

            byte[] hash = HmacSHA256(b64_policy_doc, signingKey);
            final StringBuilder builder = new StringBuilder();
            for(byte b : hash) {
                builder.append(String.format("%02x", b));
            }
            String signature = builder.toString();

            return signature;

        } catch(Exception e)
        {
            e.printStackTrace();

            System.exit(0);
        }

        //for compiler, never run
        return "";
    }

    private static String buildPolicyDoc(String expiration, String bucket, String folder, String algorithm,
                                         String accessKeyID, String dateStamp, String region, String serviceName,
                                         String redirectPage)
    {
        String policyDoc = "{\n" +
                "  \"expiration\":\"" + expiration + " T00:00:00Z\",\n" +
                "  \"conditions\": [\n" +
                "    {\"bucket\":\"" + bucket + "\"},\n" +
                "    [\"starts-with\",\"$key\",\"" + folder + "/\"],\n" +
                "    {\"acl\":\"private\"},\n" +
                "    {\"success_action_redirect\":\"http://yetanotherwhatever.io/" + redirectPage + "\"},\n" +
                "    {\"x-amz-algorithm\":\"" + algorithm + "\"},\n" +
                "    {\"x-amz-credential\":\"" + accessKeyID + "/" + dateStamp + "/" + region + "/" + serviceName + "/aws4_request\"},\n" +
                "    {\"x-amz-date\":\"" + dateStamp + "T000000Z\"},\n" +
                "    {\"x-amz-storage-class\":\"REDUCED_REDUNDANCY\"},\n" +
                "    [\"content-length-range\",0,1048576]\n" +
                "  ]\n" +
                "}";

        return policyDoc;
    }

    private static String buildForm(String folder, String policyDoc, String algorithm, String accessKeyID,
                                    String dateStamp, String signedPolicy, String additionalFields,
                                    String redirectPage, String validation, String formId)
    {

        String form = "<form id=\"" + formId + "\" action=\"http://public.yetanotherwhatever.io.s3.amazonaws.com/\" method=\"post\"" +
                " enctype=\"multipart/form-data\" onsubmit=\"return(" + validation + ");\">\n" +
                "\t      <input type=\"hidden\" name=\"key\" value=\"" + folder + "/${filename}\">\n" +
                "\t      <input type=\"hidden\" name=\"acl\" value=\"private\"> \n" +
                "\t      <input type=\"hidden\" name=\"success_action_redirect\" value=\"http://yetanotherwhatever.io/" + redirectPage + "\">\n" +
                "\t      <input type=\"hidden\" name=\"policy\" value='" + policyDoc + "'>\n" +
                "\t       <input type=\"hidden\" name=\"x-amz-algorithm\" value=\"" + algorithm + "\">\n" +
                "\t       <input type=\"hidden\" name=\"x-amz-credential\" value=\"" + accessKeyID + "/" + dateStamp + "/us-east-1/s3/aws4_request\">\n" +
                "\t       <input type=\"hidden\" name=\"x-amz-date\" value=\"" + dateStamp + "T000000Z\">\n" +
                "\t       <input type=\"hidden\" name=\"x-amz-storage-class\" value=\"REDUCED_REDUNDANCY\">\n" +
                "\t       <input type=\"hidden\" name=\"x-amz-signature\" value=\"" + signedPolicy + "\">\n" +
                "\t      <!-- Include any additional input fields here -->\n" +
                additionalFields +
                "\t      <input type=\"submit\" value=\"Upload File\">\n" +
                "    </form>";

        return form;
    }

    public static void main(String[] args) {

        String accessKeyID = args[0];
        String aws_secret_key = args[1];

        //ATTN: AWS weirdness/bug
        //expiration will be calculate by S3 as max 7 days from x-amz-date
        //so set x-amz-date in the future if you want a longer expiration period
        //else you will encounter policy expired 403 errors when you submit your form 7 days past
        String expiration = "2018-01-01";
        String bucket = "public.yetanotherwhatever.io";
        String codeFolder = "code";
        String outputFolder = "uploads";

        String dateStamp = expiration.replaceAll("-", "");
        String region = "us-east-1";
        String serviceName = "s3";
        String algorithm = "AWS4-HMAC-SHA256";

        //policy for uploading user's test output
        String outputRedirectPage = "submitting.html";
        String outputPolicyDoc = buildPolicyDoc(expiration, bucket, outputFolder, algorithm, accessKeyID, dateStamp, region, serviceName, outputRedirectPage);
        String b64outputPolicyDoc = b64Encode(outputPolicyDoc);
        String signedOutputPolicyDoc = signPolicy(b64outputPolicyDoc, aws_secret_key, dateStamp, region, serviceName);
        String outputFormId = "outputForm";
        String outputAdditionalFields = "\n" +
                "      <div class=\"formlabel\">File to upload: <input id=\"outputFile\" name=\"file\" type=\"file\"> </div>\n" +
                "      \n" +
                "      <br>\n";
        String outputFormValidation= "genSlnKey()";
        String outputForm = buildForm(outputFolder, b64outputPolicyDoc, algorithm, accessKeyID, dateStamp,
                signedOutputPolicyDoc, outputAdditionalFields, outputRedirectPage, outputFormValidation, outputFormId);


        System.out.println();
        System.out.println("Output upload form: ");
        System.out.println(outputForm);
        System.out.println();
        System.out.println();


        //policy for uploading user code (.zip)
        //

        //String codePolicyDoc = buildPolicyDoc(expiration, bucket, codeFolder, accessKeyID);
        String codeRedirectPage = "thanks.html";
        String codePolicyDoc = buildPolicyDoc(expiration, bucket, codeFolder, algorithm, accessKeyID, dateStamp,
                region, serviceName, codeRedirectPage);
        String b64codePolicyDoc = b64Encode(codePolicyDoc);
        String signedCodePolicyDoc = signPolicy(b64codePolicyDoc, aws_secret_key, dateStamp, region, serviceName);

        String codeAdditionalFields = "\n" +
                "\t      <div class=\"formlabel\">File to upload: <input id=\"codeFile\" name=\"file\" type=\"file\"> </div>\n" +
                "\t      <br> \n" +
                "\t      <div class=\"formlabel\">Your email address (preferably the same one as on your resume):</div>\n" +
                "\t      <br>\n" +
                "\t      <input id=\"email\" name=\"email\" type=\"text\">\n" +
                "\t      <br><br>\n";
        String codeFormValidation= "genCodeKey()";
        String codeFormId = "codeForm";
        String codeForm = buildForm(codeFolder, b64codePolicyDoc, algorithm, accessKeyID, dateStamp,
                signedCodePolicyDoc, codeAdditionalFields, codeRedirectPage, codeFormValidation,codeFormId);



        System.out.println();
        System.out.println("Code upload form: ");
        System.out.println(codeForm);
        System.out.println();
        System.out.println();
    }
}
