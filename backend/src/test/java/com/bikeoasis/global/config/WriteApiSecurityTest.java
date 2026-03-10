package com.bikeoasis.global.config;

import com.bikeoasis.domain.course.controller.CourseController;
import com.bikeoasis.domain.course.service.CourseService;
import com.bikeoasis.domain.riding.controller.RidingController;
import com.bikeoasis.domain.riding.service.RidingService;
import com.bikeoasis.global.auth.AuthenticatedUserResolver;
import com.bikeoasis.global.error.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {RidingController.class, CourseController.class})
@Import({
        SecurityConfig.class,
        ApiAuthenticationEntryPoint.class,
        ApiAccessDeniedHandler.class,
        GlobalExceptionHandler.class,
        AuthenticatedUserResolver.class
})
class WriteApiSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RidingService ridingService;

    @MockBean
    private CourseService courseService;

    @MockBean(name = "jwtDecoder")
    private JwtDecoder jwtDecoder;

    @Test
    void createRiding_requiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/v1/ridings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "deviceUuid": "device-1",
                                  "title": "ride",
                                  "path": [
                                    { "lat": 37.1, "lon": 127.1 },
                                    { "lat": 37.2, "lon": 127.2 }
                                  ]
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    void createCourse_requiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/v1/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "course",
                                  "path": [
                                    { "lat": 37.1, "lon": 127.1 },
                                    { "lat": 37.2, "lon": 127.2 }
                                  ]
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    void createCourseFromRiding_requiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/v1/courses/from-riding")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "ridingId": 1,
                                  "title": "course-from-riding"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));
    }
}
