# Power BI setup
Import `../data/Online_Movie_Platform_Professional_Dataset.xlsx` into Power BI Desktop.
Load Movies, Users, Streaming_Data, Genre_Analytics, Top_50_Movies and Monthly_Analytics.
Relationships: Movies[Movie_ID] 1:* Streaming_Data[Movie_ID]; Users[User_ID] 1:* Streaming_Data[User_ID].
Recommended pages: Executive Overview, Movie Analytics, Trending, User Analytics, Streaming, Genres, Revenue.
Measures: Total Movies = DISTINCTCOUNT(Movies[Movie_ID]); Total Users = DISTINCTCOUNT(Users[User_ID]); Total Streams = COUNTROWS(Streaming_Data); Total Views = SUM(Movies[Views]); Average Rating = AVERAGE(Movies[IMDb_Rating]); Total Revenue = SUM(Movies[Revenue_INR]); Watch Hours = DIVIDE(SUM(Streaming_Data[Watch_Minutes]),60); Average Completion = AVERAGE(Streaming_Data[Completion_Percent]); Active Users = CALCULATE(DISTINCTCOUNT(Users[User_ID]),Users[Status]="Active").
