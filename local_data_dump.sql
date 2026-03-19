pg_dump: warning: there are circular foreign-key constraints on this table:
pg_dump: detail: genres
pg_dump: hint: You might not be able to restore the dump without using --disable-triggers or temporarily dropping the constraints.
pg_dump: hint: Consider using a full dump instead of a --data-only dump to avoid this problem.
pg_dump: warning: there are circular foreign-key constraints on this table:
pg_dump: detail: comments
pg_dump: hint: You might not be able to restore the dump without using --disable-triggers or temporarily dropping the constraints.
pg_dump: hint: Consider using a full dump instead of a --data-only dump to avoid this problem.
--
-- PostgreSQL database dump
--

\restrict 8xWfgQxKdx99h8ld2PCFVbXSmjUEocQf3TLPWMPHR230oceOZfpfzTFVzdIbVrw

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: studios; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.studios VALUES ('fdea5681-4dfa-4367-b0db-091f443de497', 'Arms', 'arms', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('a0f4d918-385d-4620-ba14-22608fa37606', 'Blue Eyes', 'blue-eyes', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('d4413392-a8a4-4626-a934-42cb4d4fdf9b', 'BOMB\! CUTE\! BOMB\!', 'bomb-cute-bomb', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('1ec5f3b9-cf6d-430f-9d66-64c5f1c34726', 'BreakBottle', 'breakbottle', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('101f60fc-cb7e-4897-bd5f-9aa21108ea8b', 'CherryLips', 'cherrylips', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('e52ffa1e-9614-4896-a134-4a24c0ace287', 'ChiChinoya', 'chichinoya', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('175e9f9f-3e7d-4d47-8c7b-aa422847755e', 'ChuChu', 'chuchu', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('5918e0d0-82a8-4496-b473-9eb09d13e4ae', 'Circle Tribute', 'circle-tribute', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('74890475-0802-4c1a-80e8-9ad4b7d73ecc', 'Collaboration Works', 'collaboration-works', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('04dd5f7e-c8ab-4f6b-b1eb-54ff4f6ba891', 'Cosmos', 'cosmos', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('70481efd-0762-4a60-b011-f9b05636b970', 'Cranberry', 'cranberry', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('b67703b2-0299-42d4-a20d-6180ec5c8ecf', 'Digital Works', 'digital-works', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('a61e7cd7-def0-4817-9660-7a5b1198467d', 'Discovery', 'discovery', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('fb470ec9-d017-4620-b36b-83026e2a965d', 'Edge', 'edge', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('4d08bc25-fc04-4e29-85c7-53e0b9344b05', 'Five Ways', 'five-ways', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('7a716cbc-ce1a-4f7b-b041-2dd6be67e365', 'Flavors Soft', 'flavors-soft', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('e2e78eec-655d-4ffe-9670-80d9f9cacda3', 'Frontier Works', 'frontier-works', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('d9ecff27-86b3-4909-acad-da4c89a5773b', 'Godoy', 'godoy', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('2b281a79-1c66-4cbf-9337-5b7c8e229367', 'Gold Bear', 'gold-bear', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('77009414-fbef-42f4-823d-21e0d9785a77', 'Green Bunny', 'green-bunny', NULL, '', '2026-02-24 19:00:45.498162+00', '2026-02-24 19:00:45.498162+00');
INSERT INTO public.studios VALUES ('126b7386-6b27-41b6-900f-7e79342759b4', 'Himajin Planning', 'himajin-planning', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('c7c2906e-0ea4-4087-96eb-1e917f6338f6', 'Jumondo', 'jumondo', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('09c93552-a86a-4ad1-ac3b-2abc04bc33f0', 'King Bee', 'king-bee', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('a5c0c0ec-82b4-46ed-9738-92b2e43ddef2', 'L.', 'l', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('fa304bb3-5f5c-42bf-936b-2d33494bf904', 'Lune Pictures', 'lune-pictures', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('5fad69ea-6dc8-4807-bbb3-ad7eda7b2db4', 'Magic Bus', 'magic-bus', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('1f041bd4-b791-4194-8836-787280dc21b2', 'Majin', 'majin', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('669130f8-ab13-4535-8351-88381b7b13ae', 'Mary Jane', 'mary-jane', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('beea9479-66d5-4198-95ae-62480d17a65d', 'Media Blasters', 'media-blasters', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('1e23c98a-c828-40b4-b5a1-2747596e9470', 'Mediabank', 'mediabank', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('d3256475-eeeb-44e1-b30c-2e8207ce381c', 'Metro Notes', 'metro-notes', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('ef94bd4d-4bee-49b5-a8df-2e7a073fa5ca', 'Milky Animation Label', 'milky-animation-label', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('919a769b-432f-4fad-baeb-5d2f0344ece1', 'Moon Rock', 'moon-rock', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('2969434f-f598-439c-ba84-5a62823db86b', 'Mousou Jitsugen Media', 'mousou-jitsugen-media', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('acf08e6d-9901-4cfc-9cbc-fffe49feb12d', 'Mousou Senka', 'mousou-senka', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('aae95c7e-00e1-48e2-b171-a5cc741e338b', 'MS Pictures', 'ms-pictures', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('93c08f4a-3835-4a3f-8b30-0585f806983f', 'Natural High', 'natural-high', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('ace2f015-a64a-470f-888b-a4d9a6d8104e', 'Nihikime no Dozeu', 'nihikime-no-dozeu', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('6463c6a1-f3ce-465a-8ae2-b9b34f544ef3', 'Nur', 'nur', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('f221a002-1086-4853-84bd-2ca88b36cf01', 'Pashmina', 'pashmina', NULL, '', '2026-02-24 19:00:52.514881+00', '2026-02-24 19:00:52.514881+00');
INSERT INTO public.studios VALUES ('a3ccf0aa-5b5a-420e-8a4c-c31919659bf2', 'Peach Pie', 'peach-pie', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('efc38a30-ce5e-4d08-b014-6aca9d440195', 'Peak Hunt', 'peak-hunt', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('449dde3c-2b22-46f1-b1ed-0f53507e0f2f', 'Pink Pineapple', 'pink-pineapple', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('115a37fa-be4a-4513-b3fe-da439aff2cd2', 'Pixy', 'pixy', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('70f18305-764f-4d75-bdb8-aec2cd0b8c39', 'Pixy Soft', 'pixy-soft', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('ed997176-baa8-4d23-8658-da2fcddf6b3f', 'PoRO', 'poro', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('8283ece2-07fd-441a-b114-39ec6e8b69d1', 'Queen Bee', 'queen-bee', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('89637a94-17f0-4f91-b7ac-dd7a5d6b98eb', 'Rabbit Gate', 'rabbit-gate', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('1cf2ed7d-7374-4bff-83be-e140debdfce1', 'Ryuu M''s', 'ryuu-ms', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('e21ffbba-09dd-4256-8335-c9e60abe8bed', 'Schoolzone', 'schoolzone', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('6bf422ce-0bfb-4a87-8ad0-684bd44fe479', 'SELFISH', 'selfish', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('4daff331-85aa-4dc6-98ce-9f04c489651d', 'Seven', 'seven', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('aaaffff2-daec-4518-9c14-9b43f36a9108', 'Shinjukuza', 'shinjukuza', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('6bb3ff54-b9ee-46b4-93d5-6f542d342fc1', 'Shinkuukan', 'shinkuukan', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('37844daf-3cea-4787-aae9-e4402ccfb6fc', 'Showten', 'showten', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('8933366a-958f-4d2b-a700-9bcea73807a4', 'SPEED', 'speed', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('b51ced98-5101-4fa5-a967-4cbd6dbae51d', 'Studio 1st', 'studio-1st', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('499e2746-527e-4670-b333-1ef82e5443a4', 'Studio 9 Maiami', 'studio-9-maiami', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('f2e44030-5142-4e65-8e06-1b00a16359a8', 'Studio Eromatick', 'studio-eromatick', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('f16d2fae-d24e-4478-b6ef-9068c84e240d', 'Studio Fantasia', 'studio-fantasia', NULL, '', '2026-02-24 19:00:59.869871+00', '2026-02-24 19:00:59.869871+00');
INSERT INTO public.studios VALUES ('0dba47a9-d89e-4150-9a44-5cf3f5950c3b', 'Studio Ten', 'studio-ten', NULL, '', '2026-02-24 19:01:05.589411+00', '2026-02-24 19:01:05.589411+00');
INSERT INTO public.studios VALUES ('5d5b8059-0da0-4cdc-95c5-e30fd48ec407', 'Suiseisha', 'suiseisha', NULL, '', '2026-02-24 19:01:05.589411+00', '2026-02-24 19:01:05.589411+00');
INSERT INTO public.studios VALUES ('24fced7b-e410-4896-bdbb-d5e4e600d380', 'Suzuki Mirano', 'suzuki-mirano', NULL, '', '2026-02-24 19:01:05.589411+00', '2026-02-24 19:01:05.589411+00');
INSERT INTO public.studios VALUES ('23bffea2-5150-4432-9cdb-e298e0881cbf', 'T-Rex', 't-rex', NULL, '', '2026-02-24 19:01:05.589411+00', '2026-02-24 19:01:05.589411+00');
INSERT INTO public.studios VALUES ('59cfb755-6f3e-4bab-9a00-f7890c4ecf16', 'Toranoana', 'toranoana', NULL, '', '2026-02-24 19:01:05.589411+00', '2026-02-24 19:01:05.589411+00');
INSERT INTO public.studios VALUES ('3f47b13b-f2d4-40a8-894e-b02f96a6b7d3', 'Torudaya', 'torudaya', NULL, '', '2026-02-24 19:01:05.589411+00', '2026-02-24 19:01:05.589411+00');
INSERT INTO public.studios VALUES ('0b75cbfa-7f51-4ea7-85de-8535d66b0a6c', 'Union Cho', 'union-cho', NULL, '', '2026-02-24 19:01:05.589411+00', '2026-02-24 19:01:05.589411+00');
INSERT INTO public.studios VALUES ('496bddf4-367f-40b8-bfd2-e94b5c176191', 'Valkyria', 'valkyria', NULL, '', '2026-02-24 19:01:05.589411+00', '2026-02-24 19:01:05.589411+00');
INSERT INTO public.studios VALUES ('86d5c19e-c34e-4cd0-bce5-99e501f97b79', 'White Bear', 'white-bear', NULL, '', '2026-02-24 19:01:05.589411+00', '2026-02-24 19:01:05.589411+00');
INSERT INTO public.studios VALUES ('59428f2d-32f6-4117-8a5a-8010c2954da3', 'XTER', 'xter', NULL, '', '2026-02-24 19:01:05.589411+00', '2026-02-24 19:01:05.589411+00');
INSERT INTO public.studios VALUES ('f87bca90-41da-4600-8a26-b259803483bf', 'ZIZ', 'ziz', NULL, '', '2026-02-24 19:01:05.589411+00', '2026-02-24 19:01:05.589411+00');


--
-- Data for Name: series; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: episodes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.episodes VALUES ('2c851cbe-07a1-44fd-97fb-2d2ef89842eb', NULL, 1, 1, 'Natsu to Hako - 1', 'natsu-to-hako-1', '{https://cdn.rootserver1.com/natsu-no-hako-01/gallery/gallery-ep-1-0.webp,https://cdn.rootserver1.com/natsu-no-hako-01/gallery/gallery-ep-1-10.webp,https://cdn.rootserver1.com/natsu-no-hako-01/gallery/gallery-ep-1-11.webp,https://cdn.rootserver1.com/natsu-no-hako-01/gallery/gallery-ep-1-13.webp,https://cdn.rootserver1.com/natsu-no-hako-01/gallery/gallery-ep-1-16.webp,https://cdn.rootserver1.com/natsu-no-hako-01/gallery/gallery-ep-1-3.webp,https://cdn.rootserver1.com/natsu-no-hako-01/gallery/gallery-ep-1-7.webp,https://cdn.rootserver1.com/natsu-no-hako-01/gallery/gallery-ep-1-8.webp}', 'https://cdn.rootserver1.com/natsu-no-hako-01/cover-ep-1.webp', 'https://cdn.rootserver1.com/natsu-no-hako-01/gallery/gallery-ep-1-0.webp', 317, '2026-02-24 19:27:05.338683+00', '2025-12-05', 'published', 9.0, 1, 13, 1, 2, 0, 'watch and download  Natsu to Hako - 1', 'Yoshi is walking along a mountain path with a bug net and cage in hand when he notices an unfamiliar girl in a phone booth. The girl notices Yoshi looking in the direction and calls out to him. The girl’s name is Sachi, and she seems to be having trouble getting through on the phone. Yoshi can’t leave her alone and enters the booth. But then the bug net gets stuck in the door, preventing him from getting out. To escape the heat, Yoshi takes off his clothes. Sachi hesitates, but she can’t stand the heat and takes off her clothes. Yoshi, seeing Sachi’s figure, becomes sexually aware. An insect flies out of the insect cage Yoshi is holding. Sachi panics and embraces Yoshi. Yoshi is struck by the softness of Sachi’s body.

', '2026-02-24 19:27:05.338683+00', '2026-03-09 14:36:24.78788+00', 'Yoshi is walking along a mountain path with a bug net and cage in hand when he notices an unfamiliar girl in a phone booth. The girl notices Yoshi looking in the direction and calls out to him. The girl’s name is Sachi, and she seems to be having trouble getting through on the phone. Yoshi can’t leave her alone and enters the booth. But then the bug net gets stuck in the door, preventing him from getting out. To escape the heat, Yoshi takes off his clothes. Sachi hesitates, but she can’t stand the heat and takes off her clothes. Yoshi, seeing Sachi’s figure, becomes sexually aware. An insect flies out of the insect cage Yoshi is holding. Sachi panics and embraces Yoshi. Yoshi is struck by the softness of Sachi’s body.

', '669130f8-ab13-4535-8351-88381b7b13ae', '{"720": "natsu-no-hako-01/720/index.m3u8", "1080": "natsu-no-hako-01/1080/index.m3u8", "2160": "natsu-no-hako-01/2160/index.m3u8"}', '{"1080": "natsu-to-haku-01/Natsu-to-Hako-01-1080p.mkv", "2160": "natsu-to-haku-01/Natsu-to-Hako-01-2160p.mkv"}', '{"720": "natsu-no-hako-01/1080/index_vtt.m3u8", "1080": "natsu-no-hako-01/1080/index_vtt.m3u8", "2160": "natsu-no-hako-01/2160/index_vtt.m3u8"}', 'natsu-no-hako-01/720/thumbs/thumbs.vtt', '夏と箱 ');


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.profiles VALUES ('23a3af56-dc68-4e01-bc07-fe3abb580295', 'user_23a3af56', 'User', NULL, '', 'admin', false, '{}', '2026-02-23 17:14:11.653061+00', '2026-02-23 17:15:00.241017+00');


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.comments VALUES ('e2983ad8-e530-44ae-bd84-666589c6cd4e', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '23a3af56-dc68-4e01-bc07-fe3abb580295', NULL, 'testt the awesomeness', 'approved', '2026-02-24 20:14:35.130885+00', '2026-02-24 20:14:51.649529+00');
INSERT INTO public.comments VALUES ('0e9e0cb8-9243-462c-889d-53cd386bb41a', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '23a3af56-dc68-4e01-bc07-fe3abb580295', NULL, 'sgdiaujsi', 'approved', '2026-02-25 16:29:31.771742+00', '2026-02-25 16:29:41.782394+00');


--
-- Data for Name: download_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: genres; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.genres VALUES ('4386143c-a35c-4ba6-a22f-242ef536c26f', 'Ahegao', 'ahegao', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('97890519-3647-4b69-a94f-74e9cf101596', 'Bestiality', 'bestiality', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('4b6b2b26-bf40-40ac-98fe-1b87c7d148de', 'Bondage', 'bondage', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('614696a6-f0d6-49b6-9ba9-a8a8460ed0a5', 'Creampie', 'creampie', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('e9c46288-bdb2-4210-a3ad-51e2ed2de3e9', 'Gore', 'gore', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('fa1886d0-2332-4879-969a-10d28803fe0d', 'Harem', 'harem', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('d9c79eff-9270-4f7e-9ce1-f9b49a06f592', 'Incest', 'incest', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('e9044688-8f6c-4daf-ade7-230f169839c7', 'Lactation', 'lactation', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('b1c3601f-1358-4dc8-9420-6ead40337eb1', 'Lq', 'lq', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('38b96cc9-4f32-4d7a-91e2-f0387ab8bf84', 'Mind Break', 'mind-break', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('27c1b574-5192-4480-8eff-f2978f0976c7', 'Mind Control', 'mind-control', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('2888170f-9fcf-4927-a05d-a2aa001b9dca', 'Orc', 'orc', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('54c4e058-b0fc-4a3f-a639-7219f4aac266', 'Scat', 'scat', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('dce92d50-30e7-4c48-8d64-798e92f77a8e', 'Tentacle', 'tentacle', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('ae712c2a-f478-4acb-9ccc-9bab2abef2a8', 'Toys', 'toys', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('b4faf2f1-defe-4f0f-bca4-004e754afc49', 'Tsundere', 'tsundere', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('84a93722-1fad-447e-836f-9e7cf7684a63', 'Virgin', 'virgin', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('cb22cc95-dd03-41d2-ae19-29edea089b36', 'Yuri', 'yuri', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('e4d32960-76d5-4b95-b55b-685d789d9882', 'Action', 'action', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('a852e804-6045-4e08-9ba8-5b40d358dd3f', 'Appearance', 'appearance', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('73d842d0-5484-42ce-b04e-e9ab16f356d9', 'Type', 'type', false, NULL, '2026-02-24 18:51:24.696308+00');
INSERT INTO public.genres VALUES ('fd34c6af-6797-4699-82a6-3ac3219a65d4', 'Anal', 'anal', true, 'e4d32960-76d5-4b95-b55b-685d789d9882', '2026-02-24 18:51:36.865425+00');
INSERT INTO public.genres VALUES ('6d822df7-c583-473f-9621-1e8c16daabfc', 'BDSM', 'bdsm', true, 'e4d32960-76d5-4b95-b55b-685d789d9882', '2026-02-24 18:51:36.865425+00');
INSERT INTO public.genres VALUES ('348be43f-bf82-4c8d-aa06-ad6735ce0680', 'Facial', 'facial', true, 'e4d32960-76d5-4b95-b55b-685d789d9882', '2026-02-24 18:51:36.865425+00');
INSERT INTO public.genres VALUES ('f6d8018c-f5ab-468b-8072-a3ed8f81b8ec', 'Blow Job', 'blow-job', true, 'e4d32960-76d5-4b95-b55b-685d789d9882', '2026-02-24 18:51:36.865425+00');
INSERT INTO public.genres VALUES ('c49c7863-00de-4572-942d-767408e531fc', 'Boob Job', 'boob-job', true, 'e4d32960-76d5-4b95-b55b-685d789d9882', '2026-02-24 18:51:36.865425+00');
INSERT INTO public.genres VALUES ('731255f8-22ba-4e70-ae7b-d0fd2d36050f', 'Foot Job', 'foot-job', true, 'e4d32960-76d5-4b95-b55b-685d789d9882', '2026-02-24 18:51:36.865425+00');
INSERT INTO public.genres VALUES ('4858f89f-7cf7-4586-8ef1-62edb74c90e8', 'Hand Job', 'hand-job', true, 'e4d32960-76d5-4b95-b55b-685d789d9882', '2026-02-24 18:51:36.865425+00');
INSERT INTO public.genres VALUES ('c35c2824-cad6-4d4b-8932-b71568487a22', 'Rimjob', 'rimjob', true, 'e4d32960-76d5-4b95-b55b-685d789d9882', '2026-02-24 18:51:36.865425+00');
INSERT INTO public.genres VALUES ('a64c98c7-4622-46b6-a2ae-875c4a4392b6', 'Inflation', 'inflation', true, 'e4d32960-76d5-4b95-b55b-685d789d9882', '2026-02-24 18:51:36.865425+00');
INSERT INTO public.genres VALUES ('c37b2bae-3803-4b35-ab81-5a343f305fde', 'Masturbation', 'masturbation', true, 'e4d32960-76d5-4b95-b55b-685d789d9882', '2026-02-24 18:51:36.865425+00');
INSERT INTO public.genres VALUES ('aebd76c1-9dd0-4df9-9288-6529879edbf7', 'Public Sex', 'public-sex', true, 'e4d32960-76d5-4b95-b55b-685d789d9882', '2026-02-24 18:51:36.865425+00');
INSERT INTO public.genres VALUES ('e7d69df5-0694-4e1c-b60d-a4d40792dfce', 'Rape', 'rape', true, 'e4d32960-76d5-4b95-b55b-685d789d9882', '2026-02-24 18:51:36.865425+00');
INSERT INTO public.genres VALUES ('a44e00ed-77be-44d7-8947-dc2852962568', 'Reverse Rape', 'reverse-rape', true, 'e4d32960-76d5-4b95-b55b-685d789d9882', '2026-02-24 18:51:36.865425+00');
INSERT INTO public.genres VALUES ('630ac43b-5868-4889-a8d4-bbea11391d3f', 'Threesome', 'threesome', true, 'e4d32960-76d5-4b95-b55b-685d789d9882', '2026-02-24 18:51:36.865425+00');
INSERT INTO public.genres VALUES ('ae39f76d-0838-47af-8c58-5e6bc4bf7fba', 'Orgy', 'orgy', true, 'e4d32960-76d5-4b95-b55b-685d789d9882', '2026-02-24 18:51:36.865425+00');
INSERT INTO public.genres VALUES ('1d129509-cb5e-4c84-99a3-1e5eda0347a2', 'Gangbang', 'gangbang', true, 'e4d32960-76d5-4b95-b55b-685d789d9882', '2026-02-24 18:51:36.865425+00');
INSERT INTO public.genres VALUES ('1471bfab-0ccf-47f4-94cb-e0a4580a84fe', 'Loli', 'loli', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('30a3066f-6006-49cc-bceb-fc7654c9f53c', 'Shota', 'shota', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('0aed071d-a531-409d-9a0b-9afc5c6eaa18', 'MILF', 'milf', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('1db73f83-99fa-470f-8696-0b91817d2e8e', 'Futanari', 'futanari', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('16283522-e733-4e25-bf49-2f73084545e8', 'Big Boobs', 'big-boobs', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('21d81491-ffb9-4550-9a42-078ca884fbcb', 'Small Boobs', 'small-boobs', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('ba281f8a-d13c-4e3d-9268-ebf18c4f8688', 'Dark Skin', 'dark-skin', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('28bd1a5d-266b-4398-9392-861e619ee523', 'Cosplay', 'cosplay', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('e8e9eccc-ae8b-4cdb-a9fa-bbd00cf7485b', 'Elf', 'elf', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('5c3a27ad-c3d8-42d6-94b5-0a553f526afb', 'Maid', 'maid', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('0c17b515-78cd-41ae-a325-08ddc53a2233', 'Nekomimi', 'nekomimi', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('d2494a67-87cd-4eca-90b9-baa2a8a3bebe', 'Nurse', 'nurse', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('2785fea7-a37d-450b-8c8e-cf28a7b5990e', 'School Girl', 'school-girl', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('84bec45e-768f-4e36-b419-d1759e6d972f', 'Succubus', 'succubus', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('fb1d571a-90f4-4901-a115-eeb4faedf9da', 'Teacher', 'teacher', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('561f7273-017b-40bc-8200-b5a33e032aa7', 'Trap', 'trap', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('65419b6e-8347-46d4-a8a9-bf05a01459e1', 'Pregnant', 'pregnant', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('66c0c9f4-42fe-4b68-b1ac-4db4cf84a229', 'Glasses', 'glasses', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('ce27f170-43af-4f1a-a8a2-4fb973d77d6b', 'Swim Suit', 'swim-suit', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('63341396-c184-4b0c-a58a-ff6a4c317b4f', 'Ugly Bastard', 'ugly-bastard', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('e81b195c-8fe6-43bc-8a7e-7a36df13aff9', 'Monster', 'monster', true, 'a852e804-6045-4e08-9ba8-5b40d358dd3f', '2026-02-24 18:51:50.02017+00');
INSERT INTO public.genres VALUES ('dd4b12d6-cac0-4c21-8755-520f8ac2aa57', '3D', '3d', true, '73d842d0-5484-42ce-b04e-e9ab16f356d9', '2026-02-24 18:52:00.352173+00');
INSERT INTO public.genres VALUES ('b52751fb-996d-4d37-87e3-efc1aa963c2f', '4K', '4k', true, '73d842d0-5484-42ce-b04e-e9ab16f356d9', '2026-02-24 18:52:00.352173+00');
INSERT INTO public.genres VALUES ('8e923a85-4ce7-4547-ab94-242d47173ea1', '48Fps', '48fps', true, '73d842d0-5484-42ce-b04e-e9ab16f356d9', '2026-02-24 18:52:00.352173+00');
INSERT INTO public.genres VALUES ('16ea7092-1980-45d3-896e-f6d0c6794fd2', '4K 48Fps', '4k-48fps', true, '73d842d0-5484-42ce-b04e-e9ab16f356d9', '2026-02-24 18:52:00.352173+00');
INSERT INTO public.genres VALUES ('490baa39-f2b1-4793-9723-be92fe794c2f', 'Censored', 'censored', true, '73d842d0-5484-42ce-b04e-e9ab16f356d9', '2026-02-24 18:52:00.352173+00');
INSERT INTO public.genres VALUES ('2afa5fc1-9957-4416-9869-fce066f8cc21', 'Uncensored', 'uncensored', true, '73d842d0-5484-42ce-b04e-e9ab16f356d9', '2026-02-24 18:52:00.352173+00');
INSERT INTO public.genres VALUES ('453b2015-e4c6-4d32-8014-ff141b654d12', 'Comedy', 'comedy', true, '73d842d0-5484-42ce-b04e-e9ab16f356d9', '2026-02-24 18:52:00.352173+00');
INSERT INTO public.genres VALUES ('5d9d74f9-d0de-4751-a2f1-9c648dbfe939', 'Fantasy', 'fantasy', true, '73d842d0-5484-42ce-b04e-e9ab16f356d9', '2026-02-24 18:52:00.352173+00');
INSERT INTO public.genres VALUES ('c8ddff09-f6d1-45d7-9069-b479dc687e56', 'Horror', 'horror', true, '73d842d0-5484-42ce-b04e-e9ab16f356d9', '2026-02-24 18:52:00.352173+00');
INSERT INTO public.genres VALUES ('4c150869-40e8-441a-932f-16d273813e2f', 'Vanilla', 'vanilla', true, '73d842d0-5484-42ce-b04e-e9ab16f356d9', '2026-02-24 18:52:00.352173+00');
INSERT INTO public.genres VALUES ('f918b418-376e-4e72-9f84-bebac550bf77', 'NTR', 'ntr', true, '73d842d0-5484-42ce-b04e-e9ab16f356d9', '2026-02-24 18:52:00.352173+00');
INSERT INTO public.genres VALUES ('719475a1-f37b-4d3d-9707-244f56b5f47a', 'POV', 'pov', true, '73d842d0-5484-42ce-b04e-e9ab16f356d9', '2026-02-24 18:52:00.352173+00');
INSERT INTO public.genres VALUES ('1e70c344-f05d-4cbc-9404-3db29cec5f39', 'Filmed', 'filmed', true, '73d842d0-5484-42ce-b04e-e9ab16f356d9', '2026-02-24 18:52:00.352173+00');
INSERT INTO public.genres VALUES ('bc11deaf-07d0-4c46-8adf-2239be3b2f00', 'X-Ray', 'x-ray', true, '73d842d0-5484-42ce-b04e-e9ab16f356d9', '2026-02-24 18:52:00.352173+00');


--
-- Data for Name: episode_genres; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.episode_genres VALUES ('2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '8e923a85-4ce7-4547-ab94-242d47173ea1');
INSERT INTO public.episode_genres VALUES ('2c851cbe-07a1-44fd-97fb-2d2ef89842eb', 'b52751fb-996d-4d37-87e3-efc1aa963c2f');
INSERT INTO public.episode_genres VALUES ('2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '16283522-e733-4e25-bf49-2f73084545e8');
INSERT INTO public.episode_genres VALUES ('2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '490baa39-f2b1-4793-9723-be92fe794c2f');
INSERT INTO public.episode_genres VALUES ('2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '614696a6-f0d6-49b6-9ba9-a8a8460ed0a5');
INSERT INTO public.episode_genres VALUES ('2c851cbe-07a1-44fd-97fb-2d2ef89842eb', 'aebd76c1-9dd0-4df9-9288-6529879edbf7');
INSERT INTO public.episode_genres VALUES ('2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '30a3066f-6006-49cc-bceb-fc7654c9f53c');
INSERT INTO public.episode_genres VALUES ('2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '4c150869-40e8-441a-932f-16d273813e2f');
INSERT INTO public.episode_genres VALUES ('2c851cbe-07a1-44fd-97fb-2d2ef89842eb', 'bc11deaf-07d0-4c46-8adf-2239be3b2f00');
INSERT INTO public.episode_genres VALUES ('2c851cbe-07a1-44fd-97fb-2d2ef89842eb', 'e7d69df5-0694-4e1c-b60d-a4d40792dfce');
INSERT INTO public.episode_genres VALUES ('2c851cbe-07a1-44fd-97fb-2d2ef89842eb', 'c8ddff09-f6d1-45d7-9069-b479dc687e56');
INSERT INTO public.episode_genres VALUES ('2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '54c4e058-b0fc-4a3f-a639-7219f4aac266');
INSERT INTO public.episode_genres VALUES ('2c851cbe-07a1-44fd-97fb-2d2ef89842eb', 'e9c46288-bdb2-4210-a3ad-51e2ed2de3e9');


--
-- Data for Name: episode_views; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.episode_views VALUES ('af07ddde-a61a-4ca5-bcce-4cf58faff53d', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', NULL, 'eff8e7ca506627fe15dda5e0e512fcaad70b6d520f37cc76597fdb4f2d83a1a3', '2026-02-25 16:23:29.074147+00');
INSERT INTO public.episode_views VALUES ('e385b4ea-ee5a-4967-ba4b-9ee7fd82aa7b', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '23a3af56-dc68-4e01-bc07-fe3abb580295', 'eff8e7ca506627fe15dda5e0e512fcaad70b6d520f37cc76597fdb4f2d83a1a3', '2026-02-25 16:29:05.01357+00');
INSERT INTO public.episode_views VALUES ('64879a7e-2b46-4697-a9d5-a2dd2647ce30', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '23a3af56-dc68-4e01-bc07-fe3abb580295', 'eff8e7ca506627fe15dda5e0e512fcaad70b6d520f37cc76597fdb4f2d83a1a3', '2026-02-25 16:29:05.013617+00');
INSERT INTO public.episode_views VALUES ('aaf6f28a-0a36-40fb-b129-75f784bbcfad', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '23a3af56-dc68-4e01-bc07-fe3abb580295', 'eff8e7ca506627fe15dda5e0e512fcaad70b6d520f37cc76597fdb4f2d83a1a3', '2026-02-25 17:58:23.229266+00');
INSERT INTO public.episode_views VALUES ('3a6fac40-ffea-4f47-882a-a5cd559a7382', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '23a3af56-dc68-4e01-bc07-fe3abb580295', 'eff8e7ca506627fe15dda5e0e512fcaad70b6d520f37cc76597fdb4f2d83a1a3', '2026-02-25 17:58:23.233028+00');
INSERT INTO public.episode_views VALUES ('728d65f8-d752-42f1-9041-16b4b79d417c', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '23a3af56-dc68-4e01-bc07-fe3abb580295', 'eff8e7ca506627fe15dda5e0e512fcaad70b6d520f37cc76597fdb4f2d83a1a3', '2026-02-25 18:29:10.234277+00');
INSERT INTO public.episode_views VALUES ('6fb4b1a0-1fa3-41aa-9845-ec31c5039b36', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '23a3af56-dc68-4e01-bc07-fe3abb580295', 'eff8e7ca506627fe15dda5e0e512fcaad70b6d520f37cc76597fdb4f2d83a1a3', '2026-02-25 18:29:10.243928+00');
INSERT INTO public.episode_views VALUES ('de3a2196-23b0-4bff-8cea-a1017ea92c8d', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '23a3af56-dc68-4e01-bc07-fe3abb580295', 'eff8e7ca506627fe15dda5e0e512fcaad70b6d520f37cc76597fdb4f2d83a1a3', '2026-02-25 19:07:55.616034+00');
INSERT INTO public.episode_views VALUES ('2f26f31f-c963-4e50-b22c-9bedd982f0de', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '23a3af56-dc68-4e01-bc07-fe3abb580295', 'eff8e7ca506627fe15dda5e0e512fcaad70b6d520f37cc76597fdb4f2d83a1a3', '2026-02-25 19:58:22.365648+00');
INSERT INTO public.episode_views VALUES ('79da1589-9ee2-4913-8a8b-2fe388c69a48', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '23a3af56-dc68-4e01-bc07-fe3abb580295', 'eff8e7ca506627fe15dda5e0e512fcaad70b6d520f37cc76597fdb4f2d83a1a3', '2026-02-25 19:58:22.365681+00');
INSERT INTO public.episode_views VALUES ('d3ade9cc-cb80-4cc0-a1a5-0ce84489abd0', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', NULL, '4eb69097f6691649c4c3f3f207759d72c4af3a3501ecc055c8ce0800166b50da', '2026-02-27 18:21:04.577741+00');
INSERT INTO public.episode_views VALUES ('60ff8b24-3c4d-498a-bc31-1324f36f761d', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', NULL, '4eb69097f6691649c4c3f3f207759d72c4af3a3501ecc055c8ce0800166b50da', '2026-02-27 20:04:12.588588+00');
INSERT INTO public.episode_views VALUES ('94794a05-4772-4a98-ad23-c60cbaa47dd5', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', NULL, '4eb69097f6691649c4c3f3f207759d72c4af3a3501ecc055c8ce0800166b50da', '2026-03-09 14:36:24.78788+00');


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.favorites VALUES ('43b612f7-3bc3-49f9-9975-1da1f295b4d9', '23a3af56-dc68-4e01-bc07-fe3abb580295', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', '2026-02-25 16:13:25.335023+00');


--
-- Data for Name: playlists; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.playlists VALUES ('35df9ec6-2602-44fc-bcaf-82366749b909', '23a3af56-dc68-4e01-bc07-fe3abb580295', 'first public play', 'first-public-play', true, 1, '2026-02-24 19:30:09.464919+00', '2026-02-25 15:34:40.327845+00');
INSERT INTO public.playlists VALUES ('51e14837-3bb5-46ae-bec0-9b56fcd333f3', '23a3af56-dc68-4e01-bc07-fe3abb580295', 'private play for me', 'private-play-for-me', false, 1, '2026-02-24 19:30:23.75276+00', '2026-02-25 15:34:40.98802+00');


--
-- Data for Name: playlist_episodes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.playlist_episodes VALUES ('e2afc347-7629-4ad3-9f0c-048196d81894', '35df9ec6-2602-44fc-bcaf-82366749b909', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', 1, '2026-02-24 19:30:09.707737+00');
INSERT INTO public.playlist_episodes VALUES ('5603fb36-1ae6-473b-816f-3955dc88f784', '51e14837-3bb5-46ae-bec0-9b56fcd333f3', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', 1, '2026-02-24 19:30:23.938901+00');


--
-- Data for Name: ratings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.ratings VALUES ('45380f94-c356-432e-9c4c-3c1abdb2a8d5', '23a3af56-dc68-4e01-bc07-fe3abb580295', '2c851cbe-07a1-44fd-97fb-2d2ef89842eb', 9, '2026-02-25 16:29:12.93031+00', '2026-02-25 16:29:12.93031+00');


--
-- Data for Name: series_genres; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: site_pages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.site_pages VALUES ('44ca24e5-5b6b-497f-9d64-27eaf5cbb49a', 'premium', 'How to Get Premium', '## How to Get Premium

Premium members get access to:
- **4K streaming** on all episodes from day one
- **Unlimited 4K downloads**
- **No captcha** on downloads

### How to upgrade

Join our Discord server and follow the instructions in the #premium channel.

[Join Discord](#)', NULL, NULL, '2026-02-23 17:13:10.099046+00', '2026-02-23 17:13:10.099046+00');


--
-- PostgreSQL database dump complete
--

\unrestrict 8xWfgQxKdx99h8ld2PCFVbXSmjUEocQf3TLPWMPHR230oceOZfpfzTFVzdIbVrw

