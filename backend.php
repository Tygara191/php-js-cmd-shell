<?php
define("STATUS_ERROR", "error");


$result = [];

$whitelist = [
    'shutdown -h',
    'dir'
];

if(!empty($_POST['cmd'])) {
	$out = [];
	$in = $_POST['cmd'];

	if(in_array($in, $whitelist)){
        exec($in, $out);

        $result['status'] = "success";

        foreach ($out as $key => $value)
            $out[$key] = utf8_encode($value);

        $result['out'] = $out;
    }else{
	    $result['status'] = STATUS_ERROR;
	    $result['status_meta'] = "not_in_whitelist";
    }
} else {
	$result['status'] = STATUS_ERROR;
	$result['status_meta'] = "no_cmd";
}

header("Content-type: application/json");
echo json_encode($result);