package com.talentstream.service;

import java.util.List;
import java.util.stream.Collectors;

import com.talentstream.config.SecretProperties;
import com.talentstream.dto.VideoMetadataDto;
import com.talentstream.entity.Applicant;
import com.talentstream.entity.SkillBadge;
import com.talentstream.entity.VideoMetadata;
import com.talentstream.exception.CustomException;
import com.talentstream.repository.RegisterRepository;
import com.talentstream.repository.SkillBadgeRepository;
import com.talentstream.repository.VideoMetadataRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class VideoService {

    private static final Logger logger = LoggerFactory.getLogger(VideoService.class);

    private final VideoMetadataRepository videoMetadataRepository;
    private final RegisterRepository applicantRepository;
    private final SkillBadgeRepository skillBadgeRepository;
    private final SecretProperties secretProperties;

    public VideoService(VideoMetadataRepository videoMetadataRepository,
                        RegisterRepository applicantRepository,
                        SkillBadgeRepository skillBadgeRepository,
                        SecretProperties secretProperties) {
        this.videoMetadataRepository = videoMetadataRepository;
        this.applicantRepository = applicantRepository;
        this.skillBadgeRepository = skillBadgeRepository;
        this.secretProperties = secretProperties;
    }

    public List<VideoMetadataDto> getRecommendedVideos(Long applicantId) {
        Applicant applicant = applicantRepository.getApplicantById(applicantId);
        if (applicant == null) {
            throw new CustomException("Applicant not found for ID: " + applicantId, HttpStatus.NOT_FOUND);
        }

        List<Object[]> rawData = videoMetadataRepository.fetchRecommendedVideos(applicantId);

        return rawData.stream().map(obj -> {
            Long videoId = obj[0] != null ? Long.valueOf(obj[0].toString()) : null;
            String s3urlRaw = obj[1] != null ? obj[1].toString() : "";
            String normalizedUrl = normalizeUrl(s3urlRaw);

            String level = obj[2] != null ? obj[2].toString() : "";
            String title = obj[3] != null ? obj[3].toString() : "";
            String thumbnailRaw = obj[4] != null ? obj[4].toString() : "";
            String thumbnail = normalizeUrl(thumbnailRaw);
            String skillTag = obj[5] != null ? obj[5].toString() : "";

            return new VideoMetadataDto(videoId, normalizedUrl, level, title, thumbnail, skillTag);
        }).collect(Collectors.toList());
    }

    /**
     * Normalize stored value into a public URL:
     * - if stored value is already HTTP(S) return as-is
     * - if stored value looks like a key, prefix with CloudFront (if enabled) else S3 domain
     */
    private String normalizeUrl(String stored) {
        if (stored == null || stored.isBlank()) return stored;

        String trimmed = stored.trim();

        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }

        // treat as key (e.g., "Videos/uuid.mp4" or "/Videos/uuid.mp4")
        String key = trimmed.startsWith("/") ? trimmed.substring(1) : trimmed;

        if (secretProperties.isUseCloudFront() && secretProperties.getCloudfrontUrl() != null && !secretProperties.getCloudfrontUrl().isBlank()) {
            String cf = secretProperties.getCloudfrontUrl();
            if (cf.endsWith("/")) cf = cf.substring(0, cf.length() - 1);
            return cf + "/" + key;
        } else {
            String s3 = secretProperties.getS3Domain();
            if (s3.endsWith("/")) s3 = s3.substring(0, s3.length() - 1);
            return s3 + "/" + key;
        }
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

    // keep your searchVideos and getSearchSuggestions implementations unchanged
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
