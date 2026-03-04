package com.ohgiraffers.project;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import com.bikeoasis.domain.poi.controller.PoiController;
import com.bikeoasis.domain.poi.service.PoiService;
import com.bikeoasis.domain.riding.controller.RidingController;
import com.bikeoasis.domain.riding.service.RidingService;
import com.bikeoasis.domain.user.controller.LocationController;
import com.bikeoasis.domain.user.controller.UserController;
import com.bikeoasis.domain.user.service.LocationService;
import com.bikeoasis.domain.user.service.UserService;

@WebMvcTest(controllers = {
        PoiController.class,
        RidingController.class,
        LocationController.class,
        UserController.class
})
class ProjectApplicationTests {

    @MockBean
    private PoiService poiService;

    @MockBean
    private RidingService ridingService;

    @MockBean
    private LocationService locationService;

    @MockBean
    private UserService userService;

    @Test
    void contextLoads() {
    }

}
