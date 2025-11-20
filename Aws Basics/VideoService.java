package com.talentstream.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.talentstream.dto.VideoMetadataDto;
import com.talentstream.entity.Applicant;
import com.talentstream.entity.SkillBadge;
import com.talentstream.entity.VideoMetadata;
import com.talentstream.exception.CustomException;
import com.talentstream.repository.RegisterRepository;
import com.talentstream.repository.SkillBadgeRepository;
import com.talentstream.repository.VideoMetadataRepository;

@Service
public class VideoService {

	@Autowired
	private VideoMetadataRepository videoMetadataRepository;
	
	@Autowired
    private RegisterRepository applicantRepository;

	@Autowired
	private SkillBadgeRepository skillBadgeRepository;

	//Code added by Me
	private static final String S3_DOMAIN = "https://shopverse-2025.s3.eu-north-1.amazonaws.com";
	private static final String CF_DOMAIN = "https://d1jmkicqyte9zi.cloudfront.net";
	
	@Value("${app.useCloudFront:true}")
	private boolean useCloudFront;

	private String toCloudFront(String url) {
	    if (url == null) return "";
	    if (useCloudFront) { // or use 'useCloudFront' if using config
	        return url.replace(S3_DOMAIN, CF_DOMAIN);
	    } else {
	        return url; // fallback to S3 URL
	    }
	}

	
	  
	public List<VideoMetadataDto> getRecommendedVideos(Long applicantId) {
        Applicant applicant = applicantRepository.getApplicantById(applicantId);
        if (applicant == null) {
            throw new CustomException("Applicant not found for ID: " + applicantId, HttpStatus.NOT_FOUND);
	    }


		List<Object[]> rawData = videoMetadataRepository.fetchRecommendedVideos(applicantId);

//		return rawData.stream().map(obj -> new VideoMetadataDto(obj[0] != null ? Long.valueOf(obj[0].toString()) : null, // video_id
//				obj[1] != null ? obj[1].toString() : "", // s3_url
//				//obj[1] != null ? toCloudFront(obj[1].toString()) : "",
//				obj[2] != null ? obj[2].toString() : "", // level
//				obj[3] != null ? obj[3].toString() : "", // title
//				obj[4] != null ? obj[4].toString() : "", // thumbnail_url
//			    // obj[4] != null ? toCloudFront(obj[4].toString()) : "",
//				obj[5] != null ? obj[5].toString() : ""     
//		)).collect(Collectors.toList());
		return rawData.stream().map(obj -> new VideoMetadataDto(
		        obj[0] != null ? Long.valueOf(obj[0].toString()) : null, // video_id
		        obj[1] != null ? toCloudFront(obj[1].toString()) : "", // video URL (CloudFront or S3)
		        obj[2] != null ? obj[2].toString() : "", // level
		        obj[3] != null ? obj[3].toString() : "", // title
		        obj[4] != null ? toCloudFront(obj[4].toString()) : "", // thumbnail URL
		        obj[5] != null ? obj[5].toString() : "" // other field
		)).collect(Collectors.toList());

	}

	public String resolveSkillOrDefault(String requestedSkill) {
        if (requestedSkill == null || requestedSkill.trim().isEmpty()) {
            throw new CustomException("Skill cannot be empty", HttpStatus.BAD_REQUEST);
        }
        SkillBadge skillBadge = skillBadgeRepository.findByName(requestedSkill);
        if (skillBadge != null) {
            return skillBadge.getName();
        }
        return "General";
    }
    
    public List<VideoMetadata> searchVideos(String query) {
        if (query == null || query.trim().isEmpty()) {
            throw new CustomException("Search query cannot be empty", HttpStatus.BAD_REQUEST);
        }
        
        List<VideoMetadata> videos = videoMetadataRepository.findByTitleContainingIgnoreCaseOrSkillTagContainingIgnoreCase(query, query);
        
        if (videos.isEmpty()) {
            // Get suggestions for similar videos
            List<String> suggestions = getSearchSuggestions(query);
            if (!suggestions.isEmpty()) {
                String suggestionsMessage = "No exact matches found. Did you mean: " + String.join(", ", suggestions);
                throw new CustomException(suggestionsMessage, HttpStatus.NOT_FOUND);
            }
            throw new CustomException("No videos found matching your search", HttpStatus.NOT_FOUND);
        }
        
        return videos;
    }
    
    public List<String> getSearchSuggestions(String query) {
        return videoMetadataRepository.findDistinctTitlesByKeyword(query.toLowerCase())
                .stream()
                .filter(title -> title.toLowerCase().contains(query.toLowerCase()))
                .limit(5)
                .collect(Collectors.toList());
    }
}
