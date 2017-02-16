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

    //ATTN: AWS weirdness/bug
    //expiration will be calculate by S3 as max 7 days from x-amz-date
    //so set x-amz-date in the future if you want a longer expiration period
    //else you will encounter policy expired 403 errors when you submit your form 7 days past
    String m_expiration;
    String m_bucket;
    String m_dateStamp;
    String m_region;
    String m_serviceName;
    String m_algorithm;
    String m_accessKeyID;
    String m_aws_secret_key;



    AWSv4Signer(String accessKeyID, String aws_secret_key)
    {
        m_accessKeyID = accessKeyID;
        m_aws_secret_key = aws_secret_key;
        m_expiration = "2018-01-01";
        m_bucket = "public.yetanotherwhatever.io";
        m_dateStamp = m_expiration.replaceAll("-", "");
        m_region = "us-east-1";
        m_serviceName = "s3";
        m_algorithm = "AWS4-HMAC-SHA256";
    }

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

    private void buildForm(String folder, String additionalFields,
                                    String redirectPage, String validation, String formId)
    {
        String policyDoc = buildPolicyDoc(m_expiration, m_bucket, folder, m_algorithm, m_accessKeyID, m_dateStamp, m_region, m_serviceName, redirectPage);
        String b64PolicyDoc = b64Encode(policyDoc);
        String signedPolicy = signPolicy(b64PolicyDoc, m_aws_secret_key, m_dateStamp, m_region, m_serviceName);



        String form = "<form id=\"" + formId + "\" action=\"http://public.yetanotherwhatever.io.s3.amazonaws.com/\" method=\"post\"" +
                " enctype=\"multipart/form-data\" onsubmit=\"return(" + validation + ");\">\n" +
                "\t      <input type=\"hidden\" name=\"key\" value=\"" + folder + "/${filename}\">\n" +
                "\t      <input type=\"hidden\" name=\"acl\" value=\"private\"> \n" +
                "\t      <input type=\"hidden\" name=\"success_action_redirect\" value=\"http://yetanotherwhatever.io/" + redirectPage + "\">\n" +
                "\t      <input type=\"hidden\" name=\"policy\" value='" + b64PolicyDoc + "'>\n" +
                "\t       <input type=\"hidden\" name=\"x-amz-algorithm\" value=\"" + m_algorithm + "\">\n" +
                "\t       <input type=\"hidden\" name=\"x-amz-credential\" value=\"" + m_accessKeyID + "/" + m_dateStamp + "/us-east-1/s3/aws4_request\">\n" +
                "\t       <input type=\"hidden\" name=\"x-amz-date\" value=\"" + m_dateStamp + "T000000Z\">\n" +
                "\t       <input type=\"hidden\" name=\"x-amz-storage-class\" value=\"REDUCED_REDUNDANCY\">\n" +
                "\t       <input type=\"hidden\" name=\"x-amz-signature\" value=\"" + signedPolicy + "\">\n" +
                "\t      <!-- Include any additional input fields here -->\n" +
                additionalFields +
                "\t      <input type=\"submit\" value=\"Upload File\">\n" +
                "    </form>";

        System.out.println();
        System.out.println(formId + " upload form: ");
        System.out.println(form);
        System.out.println();
        System.out.println();
    }

    public static void main(String[] args) {

        String accessKeyID = args[0];
        String aws_secret_key = args[1];

        AWSv4Signer signer = new AWSv4Signer(accessKeyID, aws_secret_key);



        //policy for uploading user's test output
        String outputFolder = "uploads/output";
        String outputRedirectPage = "submitting.html";
        String outputFormId = "outputForm";
        String outputAdditionalFields = "\n" +
                "      <div class=\"formlabel\">File to upload: <input id=\"outputFile\" name=\"file\" type=\"file\"> </div>\n" +
                "      \n" +
                "      <br>\n";
        String outputFormValidation= "genSlnKey()";
        signer.buildForm(outputFolder, outputAdditionalFields, outputRedirectPage, outputFormValidation, outputFormId);



        //policy for uploading user code (.zip)
        String codeRedirectPage = "thanks.html";
        String codeFolder = "uploads/code";
        String codeAdditionalFields = "\n" +
                "\t      <div class=\"formlabel\">File to upload: <input id=\"codeFile\" name=\"file\" type=\"file\"> </div>\n" +
                "\t      <br> \n" +
                "\t      <div class=\"formlabel\">Your email address (preferably the same one as on your resume):</div>\n" +
                "\t      <br>\n" +
                "\t      <input id=\"email\" name=\"email\" type=\"text\">\n" +
                "\t      <br><br>\n";
        String codeFormValidation= "genCodeKey()";
        String codeFormId = "codeForm";
        signer.buildForm(codeFolder, codeAdditionalFields, codeRedirectPage, codeFormValidation, codeFormId);
    }
}
