package com.talentstream.service;
 
import java.io.IOException;
import java.util.UUID;
 
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
 
import com.talentstream.AwsSecretsManagerUtil;
 
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
 
@Service
public class S3Service {
 
    @Autowired
    private AwsSecretsManagerUtil secretsManagerUtil;
 
    private String bucketName;
    private String videosFolder;
    private String thumbnailsFolder;
    private String region;
    
    private String cloudFrontDomain;
 
    private S3Client s3Client;
 
    private void initialize() {
        if (s3Client != null) return;
 
        String secret = secretsManagerUtil.getSecret();
        JSONObject json = new JSONObject(secret);
 
        String accessKey = json.getString("AWS_ACCESS_KEY_ID");
        String secretKey = json.getString("AWS_SECRET_ACCESS_KEY");
        cloudFrontDomain = json.getString("CLOUDFRONT_DOMAIN");
        bucketName = json.getString("S3_VIDEO_BUCKET_NAME");
        region = json.getString("AWS_REGION");
        

 
        videosFolder = json.optString("VIDEOS_FOLDER", "Videos/");
        thumbnailsFolder = json.optString("THUMBNAIL_FOLDER");
 
        AwsBasicCredentials creds = AwsBasicCredentials.create(accessKey, secretKey);
 
        s3Client = S3Client.builder()
                .credentialsProvider(StaticCredentialsProvider.create(creds))
                .region(Region.of(region))
                .build();
    }
 
    // Upload Video
    public String uploadVideo(MultipartFile file) {
        try {
            initialize();

            return uploadFileToFolder(file, videosFolder);
        } catch (Exception e) {
            System.out.println("Video upload failed: " + e.getMessage());
            return null;
        }
    }
 
    // Upload Thumbnail
    public String uploadThumbnail(MultipartFile file) {
        try {
            initialize();
            System.out.println("starting to upload the thumbnail");
            return uploadFileToFolder(file, thumbnailsFolder);
        } catch (Exception e) {
            System.err.println("Thumbnail upload failed: " + e.getMessage());
            return null;
        }
    }
 
    private String uploadFileToFolder(MultipartFile file, String folder) throws IOException {
        initialize();
 
        String originalFilename = file.getOriginalFilename();
        String extension = "";
 
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
 
        String uniqueFileName = folder + UUID.randomUUID().toString() + extension;
 
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(uniqueFileName)
                .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .build();
 
        s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));
 
       // return "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + uniqueFileName;
        return "https://"+ cloudFrontDomain + "/" + uniqueFileName;

    }
 
    @Async
    public void deleteFile(String fileUrl) {
        initialize();
 
        if (fileUrl == null || fileUrl.isEmpty()) {
            System.out.println("Empty file URL — skipping delete.");
            return;
        }
 
        try {
            String[] parts = fileUrl.split(".amazonaws.com/");
            if (parts.length < 2) {
                System.out.println("Invalid S3 URL: " + fileUrl);
                return;
            }
 
            String key = parts[1];
 
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
 
            s3Client.deleteObject(deleteObjectRequest);

 
        } catch (Exception e) {
            System.err.println("Failed to delete file: " + e.getMessage());
        }
    }
 
}