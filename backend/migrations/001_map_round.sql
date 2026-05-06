-- Round history per map
-- kills: JSON array of { killer_name, victim_name, headshot, weapon }
CREATE TABLE IF NOT EXISTS map_round (
  id               INT          NOT NULL AUTO_INCREMENT,
  map_id           INT          NOT NULL,
  round_num        INT          NOT NULL,
  winner_team_id   INT          DEFAULT NULL,
  t1_score_after   SMALLINT     NOT NULL DEFAULT 0,
  t2_score_after   SMALLINT     NOT NULL DEFAULT 0,
  kills            JSON         DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_map_round (map_id, round_num),
  CONSTRAINT fk_map_round_map FOREIGN KEY (map_id) REFERENCES map_stats (id) ON DELETE CASCADE
);
