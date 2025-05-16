
-- Function to get expired driver requests
CREATE OR REPLACE FUNCTION get_expired_driver_requests(current_time text)
RETURNS TABLE (
  id uuid,
  topic_id uuid,
  region text,
  title text,
  expires_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    drp.id,
    drp.topic_id,
    drp.region,
    drp.title,
    drp.expires_at
  FROM 
    driver_response_pending drp
  WHERE 
    drp.expires_at < current_time::timestamp with time zone;
END;
$$ LANGUAGE plpgsql;

-- Function to delete a driver response
CREATE OR REPLACE FUNCTION delete_driver_response(request_id uuid)
RETURNS void AS $$
BEGIN
  DELETE FROM driver_response_pending 
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get a pending response for a topic
CREATE OR REPLACE FUNCTION get_pending_response(topic_id_param uuid)
RETURNS TABLE (
  id uuid,
  topic_id uuid,
  region text,
  title text,
  expires_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    drp.id,
    drp.topic_id,
    drp.region,
    drp.title,
    drp.expires_at
  FROM 
    driver_response_pending drp
  WHERE 
    drp.topic_id = topic_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to clear all pending responses for a topic
CREATE OR REPLACE FUNCTION clear_driver_pending_responses(topic_id_param uuid)
RETURNS void AS $$
BEGIN
  DELETE FROM driver_response_pending 
  WHERE topic_id = topic_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to create a driver response pending entry
CREATE OR REPLACE FUNCTION create_driver_response_pending(
  topic_id_param uuid, 
  region_param text,
  title_param text,
  expires_at_param text
)
RETURNS uuid AS $$
DECLARE
  inserted_id uuid;
BEGIN
  INSERT INTO driver_response_pending (
    topic_id,
    region,
    title,
    expires_at
  ) VALUES (
    topic_id_param,
    region_param,
    title_param,
    expires_at_param::timestamp with time zone
  )
  RETURNING id INTO inserted_id;
  
  RETURN inserted_id;
END;
$$ LANGUAGE plpgsql;
