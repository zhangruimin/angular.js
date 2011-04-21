#!/bin/sh
tests=$1
norecompile=$2

if [[ $norecompile = "" ]]; then
  rake compile
fi

java -jar lib/jstestdriver/JsTestDriver.jar --tests all --config jsTestDriver-perf.conf $@
