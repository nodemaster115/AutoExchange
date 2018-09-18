TRUNCATE users CASCADE;
DELETE FROM register;
DELETE FROM games;
DELETE FROM transfers;
DELETE FROM supports;
UPDATE common SET strvalue='0' WHERE strkey='in_come_bets'